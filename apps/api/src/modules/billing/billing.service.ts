import Stripe from 'stripe';
import { prisma, env } from '../../config';
import { AppError } from '../../middleware';
import type { Organization } from '@prisma/client';

function getStripe(): Stripe | null {
  if (!env.STRIPE_SECRET_KEY) return null;
  return new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2025-01-27.acacia' });
}

function daysLeft(date: Date): number {
  return Math.max(0, Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
}

export function getBillingStatus(org: Organization) {
  return {
    plan: org.plan,
    status: org.status,
    trialEndsAt: org.trialEndsAt.toISOString(),
    daysLeft: org.status === 'TRIALING' ? daysLeft(org.trialEndsAt) : 0,
    currentPeriodEnd: org.currentPeriodEnd?.toISOString(),
    stripeCustomerId: org.stripeCustomerId ?? undefined,
  };
}

export async function createCheckoutSession(org: Organization, userId: string, frontendUrl: string) {
  const stripe = getStripe();
  if (!stripe) throw new AppError(503, 'Stripe no está configurado');
  if (!env.STRIPE_PRO_PRICE_ID) throw new AppError(503, 'Plan PRO no configurado');

  let customerId = org.stripeCustomerId;

  if (!customerId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    const customer = await stripe.customers.create({
      email: user?.email,
      name: org.name,
      metadata: { organizationId: org.id },
    });

    customerId = customer.id;
    await prisma.organization.update({
      where: { id: org.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const successUrl = env.STRIPE_SUCCESS_URL || `${frontendUrl}/billing?success=1`;
  const cancelUrl = env.STRIPE_CANCEL_URL || `${frontendUrl}/billing?cancelled=1`;

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: env.STRIPE_PRO_PRICE_ID, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { organizationId: org.id },
  });

  return { url: session.url };
}

export async function createPortalSession(org: Organization, frontendUrl: string) {
  const stripe = getStripe();
  if (!stripe) throw new AppError(503, 'Stripe no está configurado');
  if (!org.stripeCustomerId) throw new AppError(400, 'No tienes una suscripción activa');

  const returnUrl = `${frontendUrl}/billing`;
  const session = await stripe.billingPortal.sessions.create({
    customer: org.stripeCustomerId,
    return_url: returnUrl,
  });

  return { url: session.url };
}

export async function handleStripeWebhook(rawBody: Buffer, signature: string) {
  const stripe = getStripe();
  if (!stripe || !env.STRIPE_WEBHOOK_SECRET) return;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch {
    throw new AppError(400, 'Invalid Stripe signature');
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const organizationId = session.metadata?.organizationId;
      if (!organizationId || !session.subscription) break;

      const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
      await prisma.organization.update({
        where: { id: organizationId },
        data: {
          plan: 'PRO',
          status: 'ACTIVE',
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: session.subscription as string,
          currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
        },
      });
      console.log(`[Stripe] Org ${organizationId} upgraded to PRO`);
      break;
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;
      const org = await prisma.organization.findFirst({
        where: { stripeSubscriptionId: sub.id },
      });
      if (!org) break;

      await prisma.organization.update({
        where: { id: org.id },
        data: {
          status: sub.status === 'active' ? 'ACTIVE' : 'SUSPENDED',
          currentPeriodEnd: new Date((sub as any).current_period_end * 1000),
        },
      });
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      const org = await prisma.organization.findFirst({
        where: { stripeSubscriptionId: sub.id },
      });
      if (!org) break;

      await prisma.organization.update({
        where: { id: org.id },
        data: { status: 'SUSPENDED', plan: 'TRIAL' },
      });
      console.log(`[Stripe] Org ${org.id} subscription cancelled → SUSPENDED`);
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      console.warn(`[Stripe] Payment failed for customer ${invoice.customer}`);
      break;
    }
  }
}
