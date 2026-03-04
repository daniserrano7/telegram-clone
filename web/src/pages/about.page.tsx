import { Link } from 'react-router-dom';
import { Logo } from 'src/components/logo';

const techStack = {
  backend: [
    {
      name: 'NestJS',
      description:
        'Modular, decorator-based Node.js framework with dependency injection',
      icon: '🏗️',
      color: 'text-red-400',
    },
    {
      name: 'PostgreSQL',
      description:
        'Relational database for structured, persistent data storage',
      icon: '🐘',
      color: 'text-blue-400',
    },
    {
      name: 'Prisma ORM',
      description: 'Type-safe database client with auto-generated migrations',
      icon: '🔷',
      color: 'text-indigo-400',
    },
    {
      name: 'Socket.io',
      description: 'Bidirectional WebSocket communication for real-time events',
      icon: '⚡',
      color: 'text-yellow-400',
    },
    {
      name: 'JWT + bcrypt',
      description: 'Stateless authentication with hashed passwords',
      icon: '🔐',
      color: 'text-green-400',
    },
    {
      name: 'Web Push API',
      description: 'VAPID-based push notifications via Service Worker',
      icon: '🔔',
      color: 'text-purple-400',
    },
  ],
  frontend: [
    {
      name: 'React 18',
      description: 'Component-driven UI with hooks and concurrent features',
      icon: '⚛️',
      color: 'text-cyan-400',
    },
    {
      name: 'TypeScript',
      description: 'End-to-end type safety across frontend and backend',
      icon: '🔵',
      color: 'text-blue-400',
    },
    {
      name: 'Vite',
      description: 'Lightning-fast dev server and optimized production builds',
      icon: '⚡',
      color: 'text-yellow-400',
    },
    {
      name: 'Tailwind CSS',
      description:
        'Utility-first styling with CSS variables for dynamic theming',
      icon: '🎨',
      color: 'text-teal-400',
    },
    {
      name: 'Zustand',
      description: 'Lightweight, reactive state management without boilerplate',
      icon: '🐻',
      color: 'text-orange-400',
    },
    {
      name: 'Dexie (IndexedDB)',
      description: 'Client-side database for offline message caching and sync',
      icon: '💾',
      color: 'text-green-400',
    },
  ],
};

const features = [
  {
    icon: '💬',
    title: 'Real-time Messaging',
    description:
      'Messages delivered instantly via WebSocket. Status tracking (sent → delivered → read) with typing indicators and online presence.',
  },
  {
    icon: '👥',
    title: 'Group Chats',
    description:
      'Create groups with custom avatars, manage members, assign admin roles, and coordinate conversations at scale.',
  },
  {
    icon: '🔔',
    title: 'Push Notifications',
    description:
      'Background notifications via Web Push API and Service Worker, even when the app is closed or in another tab.',
  },
  {
    icon: '📡',
    title: 'Offline Sync',
    description:
      'Messages cached locally in IndexedDB. Missed messages sync automatically when the connection is restored.',
  },
  {
    icon: '🎨',
    title: 'Theme Customization',
    description:
      'Light and dark modes with 6 accent colors. Customizable chat backgrounds and font sizes — all persisted locally.',
  },
  {
    icon: '🔒',
    title: 'User Management',
    description:
      'Secure registration and login, editable profiles with avatars, user blocking, and contact management.',
  },
];

const architecture = [
  {
    label: 'pnpm Monorepo',
    detail: 'server · web · shared',
    description:
      'A single repository for the API, React app, and shared TypeScript types — enabling full type safety across the stack without duplication.',
  },
  {
    label: 'Modular NestJS',
    detail: 'Auth · Chat · User · Notification · Upload',
    description:
      'Each domain is an isolated NestJS module with its own controller, service, and gateway — clean separation of concerns from day one.',
  },
  {
    label: 'Event-driven Gateway',
    detail: 'WebSocket events via Socket.io',
    description:
      'A dedicated NestJS WebSocket gateway handles real-time events: message delivery, read receipts, typing indicators, and online status.',
  },
  {
    label: 'Shared Type Contracts',
    detail: 'DTOs consumed by both ends',
    description:
      'API request/response shapes and WebSocket event payloads are defined once in the shared package, consumed by both server and client.',
  },
];

export const AboutPage = () => {
  return (
    <main className="w-full h-full bg-background-primary overflow-y-auto">
      {/* Nav */}
      <nav className="sticky top-0 z-10 bg-background-primary/80 backdrop-blur-md border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-font-subtle hover:text-font transition-colors text-sm"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </Link>
          <a
            href="https://github.com/daniserrano7/telegram-clone"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-font-subtle hover:text-font transition-colors text-sm"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.73.083-.73 1.205.085 1.84 1.237 1.84 1.237 1.07 1.835 2.807 1.305 3.492.998.108-.775.418-1.305.762-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23A11.5 11.5 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.29-1.552 3.297-1.23 3.297-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.807 5.625-5.48 5.92.43.372.823 1.102.823 2.222 0 1.606-.015 2.898-.015 3.293 0 .319.216.694.825.576C20.565 21.795 24 17.298 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
            GitHub
          </a>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-20">
        {/* Hero */}
        <section className="pt-16 pb-12 text-center">
          <div className="flex justify-center mb-6">
            <Logo size="large" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-font mb-4 leading-tight">
            Telechat
          </h1>
          <p className="text-lg text-font-subtle max-w-2xl mx-auto leading-relaxed">
            A full-stack real-time messaging app built to showcase backend
            engineering skills — modular architecture, WebSocket communication,
            push notifications, and production-grade tooling.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {[
              'NestJS',
              'PostgreSQL',
              'Socket.io',
              'React',
              'TypeScript',
              'Prisma',
            ].map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 rounded-full bg-elevation text-font-subtle text-sm border border-border"
              >
                {tag}
              </span>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="mb-16">
          <SectionHeader
            label="Features"
            title="What's implemented"
            subtitle="A production-like feature set covering the core of a modern messaging experience."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="p-5 rounded-2xl bg-elevation-contrast border border-border/50 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="text-3xl mb-3">{f.icon}</div>
                <h4 className="text-font font-semibold mb-2">{f.title}</h4>
                <p className="text-font-subtle text-sm leading-relaxed">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Architecture */}
        <section className="mb-16">
          <SectionHeader
            label="Architecture"
            title="Designed for maintainability"
            subtitle="A monorepo structure that keeps the backend, frontend, and shared contracts in sync."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {architecture.map((item) => (
              <div
                key={item.label}
                className="p-5 rounded-2xl bg-elevation-contrast border border-border/50 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="mb-2">
                  <span className="text-font font-semibold text-sm">
                    {item.label}
                  </span>
                  <span className="ml-2 text-xs text-font-primary font-mono bg-primary/10 px-2 py-0.5 rounded-full">
                    {item.detail}
                  </span>
                </div>
                <p className="text-font-subtle text-sm leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Tech Stack */}
        <section className="mb-16">
          <SectionHeader
            label="Tech Stack"
            title="The right tool for each layer"
            subtitle="Carefully chosen technologies that follow industry best practices and real-world patterns."
          />

          {/* Backend */}
          <div className="mb-8">
            <h3 className="text-font font-semibold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary inline-block" />
              Backend
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {techStack.backend.map((tech) => (
                <TechCard key={tech.name} {...tech} />
              ))}
            </div>
          </div>

          {/* Frontend */}
          <div>
            <h3 className="text-font font-semibold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary inline-block" />
              Frontend
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {techStack.frontend.map((tech) => (
                <TechCard key={tech.name} {...tech} />
              ))}
            </div>
          </div>
        </section>

        {/* CI/CD & Deployment */}
        <section className="mb-16">
          <SectionHeader
            label="CI/CD & Deployment"
            title="Fully automated, production-ready pipeline"
            subtitle="Every push triggers a GitHub Actions workflow that builds, tests, and deploys the app to a VPS — zero manual steps."
          />

          {/* Pipeline flow */}
          <div className="mb-6 p-5 rounded-2xl bg-elevation-contrast border border-border/50 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-widest text-font-primary mb-4">
              Pipeline on every push
            </p>
            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 text-sm">
              {[
                { icon: '📦', label: 'Install deps' },
                { icon: '🧪', label: 'Run tests' },
                { icon: '🔨', label: 'Build' },
                { icon: '🚀', label: 'Deploy to VPS' },
                { icon: '🗄️', label: 'DB migrations' },
              ].map((step, i, arr) => (
                <div key={step.label} className="flex sm:flex-row flex-col items-center gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-elevation border border-border/30 w-full sm:w-auto">
                    <span>{step.icon}</span>
                    <span className="text-font font-medium text-xs">
                      {step.label}
                    </span>
                  </div>
                  {i < arr.length - 1 && (
                    <svg
                      className="w-4 h-4 text-font-subtle shrink-0 rotate-90 sm:rotate-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Two environments */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="p-5 rounded-2xl bg-elevation-contrast border border-border/50 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />
                <span className="text-font font-semibold text-sm">
                  Development
                </span>
                <code className="ml-auto text-xs font-mono bg-elevation px-2 py-0.5 rounded text-font-subtle">
                  develop
                </code>
              </div>
              <p className="text-font-subtle text-sm leading-relaxed">
                Deployed to a subdomain on every push to{' '}
                <span className="font-mono text-xs text-font-primary">
                  develop
                </span>
                . Password-protected at the Nginx level so the staging
                environment stays private.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-elevation-contrast border border-border/50 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
                <span className="text-font font-semibold text-sm">
                  Production
                </span>
                <code className="ml-auto text-xs font-mono bg-elevation px-2 py-0.5 rounded text-font-subtle">
                  master
                </code>
              </div>
              <p className="text-font-subtle text-sm leading-relaxed">
                Deployed to the main domain on every push to{' '}
                <span className="font-mono text-xs text-font-primary">
                  master
                </span>
                . Publicly accessible with full SSL via Let's Encrypt.
              </p>
            </div>
          </div>

          {/* Infrastructure details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                icon: '🖥️',
                title: 'VPS hosting',
                desc: 'Backend (NestJS), frontend (static files), and database all run on a single VPS.',
              },
              {
                icon: '🔀',
                title: 'Nginx reverse proxy',
                desc: 'Routes traffic between the React frontend and the NestJS API, handling WebSocket upgrades.',
              },
              {
                icon: '🔒',
                title: 'SSL + custom domain',
                desc: "TLS certificates provisioned automatically with Let's Encrypt. Custom domain with a dedicated subdomain for dev.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex gap-3 p-4 rounded-xl bg-elevation border border-border/30"
              >
                <span className="text-2xl shrink-0 mt-0.5">{item.icon}</span>
                <div>
                  <div className="text-font font-semibold text-sm">
                    {item.title}
                  </div>
                  <div className="text-font-subtle text-xs leading-relaxed mt-0.5">
                    {item.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Testing */}
        <section className="mb-8">
          <SectionHeader
            label="Testing"
            title="Confidence at every layer"
            subtitle="Unit and integration tests covering critical logic on both backend and frontend."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                icon: '⚙️',
                title: 'Backend — Jest',
                badge: 'NestJS',
                points: [
                  'Service-level unit tests with mocked Prisma client',
                  'Auth, chat, and user module coverage',
                  'DTOs and validation logic tested in isolation',
                ],
              },
              {
                icon: '🖥️',
                title: 'Frontend — Vitest + Testing Library',
                badge: 'React',
                points: [
                  'Component tests with @testing-library/react',
                  'User interaction simulation with @testing-library/user-event',
                  'Chat and message input components covered',
                ],
              },
            ].map((item) => (
              <div
                key={item.title}
                className="p-5 rounded-2xl bg-elevation-contrast border border-border/50 shadow-sm"
              >
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <div className="text-font font-semibold text-sm">
                      {item.title}
                    </div>
                    <span className="text-xs text-font-primary font-mono bg-primary/10 px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  </div>
                </div>
                <ul className="space-y-2">
                  {item.points.map((p) => (
                    <li
                      key={p}
                      className="flex items-start gap-2 text-font-subtle text-sm"
                    >
                      <span className="text-icon-success mt-0.5 shrink-0">
                        ✓
                      </span>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <div className="inline-block p-px rounded-2xl bg-gradient-to-br from-primary/50 via-primary/20 to-transparent">
            <div className="bg-elevation-contrast rounded-2xl px-8 py-10">
              <h2 className="text-2xl font-bold text-font mb-2">
                See it in action
              </h2>
              <p className="text-font-subtle mb-6 max-w-md mx-auto text-sm leading-relaxed">
                Create an account, open the app in two different tabs, and watch
                real-time messaging, typing indicators, and notifications work
                together.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link
                  to="/register"
                  className="px-6 py-2.5 bg-primary text-font-primary-contrast rounded-xl font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                >
                  Try the app
                </Link>
                <a
                  href="https://github.com/daniserrano7/telegram-clone"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-2.5 bg-elevation text-font rounded-xl font-medium hover:bg-elevation-hover transition-colors"
                >
                  View source
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

const SectionHeader = ({
  label,
  title,
  subtitle,
}: {
  label: string;
  title: string;
  subtitle: string;
}) => (
  <div className="mb-8">
    <span className="text-xs font-semibold uppercase tracking-widest text-font-primary">
      {label}
    </span>
    <h2 className="text-2xl font-bold text-font mt-1 mb-2">{title}</h2>
    <p className="text-font-subtle text-sm leading-relaxed max-w-2xl">
      {subtitle}
    </p>
  </div>
);

const TechCard = ({
  name,
  description,
  icon,
}: {
  name: string;
  description: string;
  icon: string;
  color: string;
}) => (
  <div className="flex gap-3 p-4 rounded-xl bg-elevation border border-border/30 hover:bg-elevation-hover transition-colors">
    <span className="text-2xl shrink-0 mt-0.5">{icon}</span>
    <div>
      <div className="text-font font-semibold text-sm">{name}</div>
      <div className="text-font-subtle text-xs leading-relaxed mt-0.5">
        {description}
      </div>
    </div>
  </div>
);
