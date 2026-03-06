import { Link } from 'react-router-dom';
import {
  CheckSquare, Clock, Users, BarChart2, Zap, Shield,
  ArrowRight, Check, Star, Building2, Smartphone
} from 'lucide-react';

const FEATURES = [
  {
    icon: CheckSquare,
    title: 'Gestión de tareas',
    desc: 'Organiza tareas, subtareas, listas y proyectos. Asigna prioridades, fechas límite y etiquetas.',
    color: 'text-blue-600 bg-blue-50',
  },
  {
    icon: Clock,
    title: 'Seguimiento de tiempo',
    desc: 'Registra el tiempo dedicado a cada tarea. Reportes por cliente, proyecto o periodo.',
    color: 'text-purple-600 bg-purple-50',
  },
  {
    icon: Users,
    title: 'Equipos y colaboración',
    desc: 'Invita miembros a tu organización. Asigna tareas, comenta y trabaja en tiempo real.',
    color: 'text-green-600 bg-green-50',
  },
  {
    icon: Building2,
    title: 'Gestión de clientes',
    desc: 'Vincula tareas y proyectos a clientes. Controla qué está pendiente para cada uno.',
    color: 'text-orange-600 bg-orange-50',
  },
  {
    icon: BarChart2,
    title: 'Reportes y métricas',
    desc: 'Visualiza el rendimiento del equipo, avance de proyectos y horas facturables.',
    color: 'text-rose-600 bg-rose-50',
  },
  {
    icon: Smartphone,
    title: 'Notificaciones WhatsApp',
    desc: 'Recibe recordatorios y alertas de tareas directamente en WhatsApp.',
    color: 'text-teal-600 bg-teal-50',
  },
];

const PLANS = [
  {
    name: 'Trial',
    price: 'Gratis',
    period: '14 días',
    description: 'Prueba todas las funciones sin tarjeta de crédito.',
    highlight: false,
    cta: 'Empezar gratis',
    ctaTo: '/register',
    features: [
      'Hasta 3 miembros',
      'Tareas y listas ilimitadas',
      'Seguimiento de tiempo',
      'Reportes básicos',
      'Soporte por email',
    ],
  },
  {
    name: 'PRO',
    price: '$29',
    period: 'por mes',
    description: 'Para equipos que necesitan más potencia y sin límites.',
    highlight: true,
    cta: 'Empezar trial PRO',
    ctaTo: '/register',
    features: [
      'Miembros ilimitados',
      'Tareas y proyectos ilimitados',
      'Gestión de clientes',
      'Reportes avanzados',
      'Notificaciones WhatsApp',
      'Soporte prioritario',
    ],
  },
  {
    name: 'Enterprise',
    price: 'A medida',
    period: 'contacto',
    description: 'Para empresas con necesidades específicas de integración.',
    highlight: false,
    cta: 'Contactar ventas',
    ctaTo: 'mailto:hola@usetempo.app',
    external: true,
    features: [
      'Todo lo de PRO',
      'SSO / SAML',
      'Onboarding dedicado',
      'SLA garantizado',
      'Factura personalizada',
      'Soporte 24/7',
    ],
  },
];

const TESTIMONIALS = [
  {
    text: 'Tempo nos ayudó a dejar de perder tiempo buscando en qué estábamos. Todo el equipo sabe qué hacer cada día.',
    author: 'Laura M.',
    role: 'CEO, Agencia digital',
    stars: 5,
  },
  {
    text: 'El seguimiento de tiempo por cliente cambió cómo facturamos. Por fin sabemos exactamente cuánto cuesta cada proyecto.',
    author: 'Carlos R.',
    role: 'Director, Consultoría IT',
    stars: 5,
  },
  {
    text: 'La integración con WhatsApp es increíble. Mis clientes reciben actualizaciones sin que yo tenga que hacer nada extra.',
    author: 'Sofía T.',
    role: 'Freelancer, Diseño UX',
    stars: 5,
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">

      {/* ── Navbar ──────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold">Tempo</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="rounded-md px-4 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Iniciar sesión
            </Link>
            <Link
              to="/register"
              className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
            >
              Empezar gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/60 to-white px-4 py-24 text-center">
        {/* Background decoration */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-blue-100/50 blur-3xl" />
          <div className="absolute -right-20 top-20 h-64 w-64 rounded-full bg-purple-100/40 blur-3xl" />
          <div className="absolute -left-20 top-40 h-64 w-64 rounded-full bg-teal-100/40 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
            <Zap className="h-3 w-3" />
            La forma más rápida de organizar tu equipo
          </div>
          <h1 className="mb-6 text-5xl font-extrabold leading-tight tracking-tight text-gray-900 sm:text-6xl">
            Gestión de tareas para{' '}
            <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
              equipos que producen
            </span>
          </h1>
          <p className="mx-auto mb-10 max-w-xl text-lg text-gray-500">
            Tempo reúne tareas, tiempo, clientes y reportes en un solo lugar.
            Sin complejidad. Sin ruido. Solo resultados.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 hover:bg-primary/90 transition-all"
            >
              Empezar gratis — 14 días trial
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-lg border px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Ya tengo cuenta
            </Link>
          </div>
          <p className="mt-4 text-xs text-gray-400">
            Sin tarjeta de crédito · Cancela cuando quieras · Setup en 2 minutos
          </p>
        </div>
      </section>

      {/* ── Social proof strip ──────────────────────────── */}
      <section className="border-y bg-gray-50 py-5">
        <div className="mx-auto max-w-4xl px-4">
          <p className="mb-4 text-center text-xs font-medium uppercase tracking-widest text-gray-400">
            Confiado por equipos en toda Latinoamérica
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm font-semibold text-gray-400">
            {['Agencias digitales', 'Consultoras IT', 'Freelancers', 'Startups', 'Despachos contables'].map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────── */}
      <section className="px-4 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="mb-3 text-3xl font-bold">Todo lo que tu equipo necesita</h2>
            <p className="text-gray-500">Diseñado para pequeños equipos que quieren moverse rápido y entregar bien.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, desc, color }) => (
              <div
                key={title}
                className="group rounded-xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className={`mb-4 inline-flex rounded-lg p-2.5 ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 font-semibold">{title}</h3>
                <p className="text-sm leading-relaxed text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────── */}
      <section className="bg-gray-50 px-4 py-24">
        <div className="mx-auto max-w-4xl">
          <div className="mb-16 text-center">
            <h2 className="mb-3 text-3xl font-bold">Listo en minutos</h2>
            <p className="text-gray-500">Sin instalación, sin configuración compleja.</p>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            {[
              { step: '01', title: 'Crea tu organización', desc: 'Regístrate con tu email, pon el nombre de tu empresa y listo. El equipo puede unirse al instante.' },
              { step: '02', title: 'Agrega tu equipo', desc: 'Invita a tus colaboradores por email. Elige su rol (admin o miembro) y empieza a asignar tareas.' },
              { step: '03', title: 'Trabaja y mide', desc: 'Crea tareas, registra tiempo, genera reportes. Todo visible para todo el equipo en tiempo real.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="relative">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                  {step}
                </div>
                <h3 className="mb-2 font-semibold">{title}</h3>
                <p className="text-sm leading-relaxed text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────── */}
      <section className="px-4 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-16 text-center">
            <h2 className="mb-3 text-3xl font-bold">Precios simples y transparentes</h2>
            <p className="text-gray-500">Empieza gratis, sin tarjeta. Actualiza cuando lo necesites.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-2xl p-6 ${
                  plan.highlight
                    ? 'bg-primary text-white shadow-2xl shadow-blue-200 ring-2 ring-primary'
                    : 'border bg-white shadow-sm'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-400 px-3 py-0.5 text-xs font-semibold text-amber-900">
                    Más popular
                  </div>
                )}
                <div className="mb-4">
                  <p className={`text-sm font-medium ${plan.highlight ? 'text-blue-100' : 'text-gray-500'}`}>
                    {plan.name}
                  </p>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold">{plan.price}</span>
                    <span className={`text-sm ${plan.highlight ? 'text-blue-200' : 'text-gray-400'}`}>
                      {plan.period}
                    </span>
                  </div>
                  <p className={`mt-2 text-sm ${plan.highlight ? 'text-blue-100' : 'text-gray-500'}`}>
                    {plan.description}
                  </p>
                </div>

                <ul className="mb-6 flex-1 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className={`h-4 w-4 flex-shrink-0 ${plan.highlight ? 'text-blue-200' : 'text-green-500'}`} />
                      <span className={plan.highlight ? 'text-blue-50' : 'text-gray-600'}>{f}</span>
                    </li>
                  ))}
                </ul>

                {plan.external ? (
                  <a
                    href={plan.ctaTo}
                    className={`block rounded-lg px-4 py-2.5 text-center text-sm font-semibold transition-colors ${
                      plan.highlight
                        ? 'bg-white text-primary hover:bg-blue-50'
                        : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {plan.cta}
                  </a>
                ) : (
                  <Link
                    to={plan.ctaTo}
                    className={`block rounded-lg px-4 py-2.5 text-center text-sm font-semibold transition-colors ${
                      plan.highlight
                        ? 'bg-white text-primary hover:bg-blue-50'
                        : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ────────────────────────────────── */}
      <section className="bg-gray-50 px-4 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-16 text-center">
            <h2 className="mb-3 text-3xl font-bold">Lo que dicen nuestros usuarios</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <div key={t.author} className="rounded-xl border bg-white p-6 shadow-sm">
                <div className="mb-3 flex gap-0.5">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="mb-4 text-sm leading-relaxed text-gray-600">"{t.text}"</p>
                <div>
                  <p className="text-sm font-semibold">{t.author}</p>
                  <p className="text-xs text-gray-400">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────── */}
      <section className="px-4 py-24">
        <div className="mx-auto max-w-2xl rounded-2xl bg-gradient-to-br from-primary to-violet-600 px-8 py-16 text-center text-white shadow-2xl shadow-blue-200">
          <h2 className="mb-4 text-3xl font-extrabold">Empieza hoy, gratis</h2>
          <p className="mb-8 text-blue-100">
            14 días de acceso completo. Sin tarjeta de crédito. Cancela cuando quieras.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 rounded-lg bg-white px-8 py-3 text-sm font-semibold text-primary shadow-lg hover:bg-blue-50 transition-colors"
          >
            Crear mi cuenta gratis
            <ArrowRight className="h-4 w-4" />
          </Link>
          <div className="mt-6 flex items-center justify-center gap-6 text-xs text-blue-200">
            <span className="flex items-center gap-1"><Check className="h-3 w-3" /> Sin tarjeta</span>
            <span className="flex items-center gap-1"><Check className="h-3 w-3" /> Setup 2 min</span>
            <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> Datos seguros</span>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer className="border-t bg-gray-50 px-4 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary">
                <Zap className="h-3 w-3 text-white" />
              </div>
              <span className="text-sm font-semibold">Tempo</span>
            </div>
            <div className="flex gap-6 text-sm text-gray-500">
              <Link to="/login" className="hover:text-gray-900 transition-colors">Iniciar sesión</Link>
              <Link to="/register" className="hover:text-gray-900 transition-colors">Registrarse</Link>
              <a href="mailto:hola@usetempo.app" className="hover:text-gray-900 transition-colors">Contacto</a>
            </div>
            <p className="text-xs text-gray-400">© {new Date().getFullYear()} Tempo. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
