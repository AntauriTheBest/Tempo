export type PlanType = 'TRIAL' | 'PRO' | 'ENTERPRISE';
export type OrgStatus = 'TRIALING' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED';
export interface Organization {
    id: string;
    name: string;
    slug: string;
    plan: PlanType;
    status: OrgStatus;
    trialEndsAt: string;
    currentPeriodEnd?: string;
    createdAt: string;
}
export interface BillingStatus {
    plan: PlanType;
    status: OrgStatus;
    trialEndsAt: string;
    daysLeft: number;
    currentPeriodEnd?: string;
    stripeCustomerId?: string;
}
//# sourceMappingURL=org.types.d.ts.map