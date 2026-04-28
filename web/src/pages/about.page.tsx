import { Link } from 'react-router-dom';
import type { IconType } from 'react-icons';
import {
  HiOutlineArrowLeft,
  HiOutlineArrowPath,
  HiOutlineBellAlert,
  HiOutlineBolt,
  HiOutlineChatBubbleLeftRight,
  HiOutlineCheckCircle,
  HiOutlineCircleStack,
  HiOutlineCloudArrowUp,
  HiOutlineCodeBracketSquare,
  HiOutlineCommandLine,
  HiOutlineCpuChip,
  HiOutlineServerStack,
  HiOutlineShieldCheck,
  HiOutlineSquares2X2,
  HiOutlineWrenchScrewdriver,
} from 'react-icons/hi2';

const productNotes = [
  {
    label: 'Realtime core',
    value: 'Socket gateway, presence, typing state, read receipts',
  },
  {
    label: 'Data model',
    value: 'PostgreSQL schema with direct chats, groups, memberships',
  },
  {
    label: 'Client runtime',
    value: 'React state, IndexedDB cache, push notification support',
  },
];

const capabilities: Capability[] = [
  {
    icon: HiOutlineChatBubbleLeftRight,
    title: 'Messaging that behaves like a real app',
    description:
      'Direct and group conversations, delivery states, typing indicators, online presence, and ordered message history all share the same event model.',
  },
  {
    icon: HiOutlineBellAlert,
    title: 'Notifications beyond the active tab',
    description:
      'The service worker and Web Push flow keep conversations reachable when the app is closed, while the backend filters recipients server-side.',
  },
  {
    icon: HiOutlineArrowPath,
    title: 'Offline-friendly client state',
    description:
      'Local IndexedDB storage keeps recent chat data available and gives the sync layer a place to reconcile missed messages after reconnecting.',
  },
  {
    icon: HiOutlineShieldCheck,
    title: 'Account and safety basics',
    description:
      'JWT sessions, bcrypt password hashes, profile editing, avatars, contacts, and blocking cover the expected surface of a private chat product.',
  },
];

const systemLayers: SystemLayer[] = [
  {
    eyebrow: 'API',
    title: 'NestJS modules',
    description:
      'Auth, users, chats, uploads, and notifications are separated into focused modules with controllers and services at clear boundaries.',
    points: ['DTO-driven routes', 'Prisma-backed services', 'JWT guard'],
  },
  {
    eyebrow: 'Realtime',
    title: 'Socket.io gateway',
    description:
      'A dedicated gateway owns rooms, user sockets, message events, read receipts, typing state, and online status transitions.',
    points: ['Per-user rooms', 'Chat broadcasts', 'Presence updates'],
  },
  {
    eyebrow: 'Client',
    title: 'React workspace',
    description:
      'The frontend uses a focused store layer around auth, chats, blocking, settings, local persistence, and socket lifecycle.',
    points: ['Zustand stores', 'Dexie cache', 'Theme variables'],
  },
];

const stackGroups: StackGroup[] = [
  {
    title: 'Backend',
    items: ['NestJS', 'PostgreSQL', 'Prisma', 'Socket.io', 'JWT', 'bcrypt'],
  },
  {
    title: 'Frontend',
    items: ['React', 'TypeScript', 'Vite', 'Tailwind CSS', 'Zustand', 'Dexie'],
  },
  {
    title: 'Operations',
    items: [
      'pnpm',
      'GitHub Actions',
      'PM2',
      'Nginx',
      'VPS',
      'Postgres migrations',
    ],
  },
];

const deliveryFlow = [
  'Install',
  'Typecheck',
  'Test',
  'Build',
  'Migrate',
  'Restart',
];

export const AboutPage = () => {
  return (
    <main className="h-full w-full overflow-y-auto bg-background-primary text-font dark:bg-[#0b1118] dark:text-[#eaf2f8]">
      <nav className="sticky top-0 z-20 border-b border-border bg-background-primary/90 backdrop-blur-xl dark:bg-[#0b1118]/90">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm font-medium text-font-subtle transition-colors hover:text-font dark:text-[#a7b6c6] dark:hover:text-white"
          >
            <HiOutlineArrowLeft className="size-4" />
            Back
          </Link>

          <a
            href="https://github.com/daniserrano7/telegram-clone"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm font-medium text-font-subtle transition-colors hover:text-font dark:text-[#a7b6c6] dark:hover:text-white"
          >
            <HiOutlineCodeBracketSquare className="size-4" />
            Source
          </a>
        </div>
      </nav>

      <section className="border-b border-border bg-[linear-gradient(180deg,rgba(36,129,204,0.10),transparent_72%)] dark:bg-[radial-gradient(circle_at_78%_18%,rgba(36,129,204,0.22),transparent_34%),linear-gradient(180deg,#0f1823_0%,#0b1118_76%)]">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-md border border-primary bg-primary/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-font-primary dark:bg-[#12314a] dark:text-[#8fd0ff]">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Engineering case study
            </div>

            <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-normal text-font dark:text-[#f5f9fc] sm:text-5xl">
              Telechat is a full-stack messaging system built around realtime
              product behavior.
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-font-subtle dark:text-[#b3c1ce] sm:text-lg">
              The project connects a modular NestJS API, a typed React client,
              PostgreSQL persistence, WebSocket events, offline caching, and
              push notifications into one coherent chat experience.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/register"
                className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-font-primary-contrast shadow-sm shadow-primary/20 transition-colors hover:bg-primary-dark dark:text-white dark:shadow-primary/30"
              >
                <HiOutlineBolt className="size-4" />
                Open app
              </Link>
              <a
                href="https://github.com/daniserrano7/telegram-clone"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-elevation-contrast px-4 text-sm font-semibold text-font transition-colors hover:bg-elevation dark:bg-[#111b26] dark:text-[#eaf2f8] dark:hover:bg-[#172433]"
              >
                <HiOutlineCommandLine className="size-4" />
                View repository
              </a>
            </div>
          </div>

          <ProductPanel />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="grid gap-4 md:grid-cols-3">
          {productNotes.map((note) => (
            <div
              key={note.label}
              className="rounded-lg border border-border bg-elevation-contrast p-5 dark:bg-[#111b26]"
            >
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-font-primary dark:text-[#8fd0ff]">
                {note.label}
              </div>
              <p className="mt-2 text-sm leading-6 text-font-subtle dark:text-[#aab8c6]">
                {note.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      <SectionBand
        eyebrow="Product surface"
        title="A compact chat app with the features users expect"
        description="The feature set is intentionally practical: each part exists because chat products need it in daily use, not because it looks good on a checklist."
      >
        <div className="grid gap-4 md:grid-cols-2">
          {capabilities.map((item) => (
            <CapabilityCard key={item.title} {...item} />
          ))}
        </div>
      </SectionBand>

      <SectionBand
        eyebrow="Architecture"
        title="Clear boundaries between API, realtime, and client state"
        description="The implementation keeps domain logic close to its owning module while sharing request, response, and socket payload types across the workspace."
        muted
      >
        <div className="grid gap-4 lg:grid-cols-3">
          {systemLayers.map((layer) => (
            <LayerCard key={layer.title} {...layer} />
          ))}
        </div>
      </SectionBand>

      <SectionBand
        eyebrow="Stack"
        title="A conventional stack, assembled with production constraints"
        description="The choices are familiar on purpose: the interesting work is in how the pieces cooperate under authentication, delivery, persistence, and deployment."
      >
        <div className="grid gap-4 lg:grid-cols-3">
          {stackGroups.map((group) => (
            <StackBlock key={group.title} {...group} />
          ))}
        </div>
      </SectionBand>

      <SectionBand
        eyebrow="Delivery"
        title="Deployment is treated as part of the product"
        description="The app is deployed from a pnpm monorepo to a VPS with Nginx, PM2, PostgreSQL, migrations, and static frontend hosting."
        muted
      >
        <div className="rounded-lg border border-border bg-elevation-contrast p-5 dark:bg-[#111b26] sm:p-6">
          <div className="grid gap-3 sm:grid-cols-6">
            {deliveryFlow.map((step, index) => (
              <div key={step} className="relative">
                <div className="flex h-full min-h-20 flex-col justify-between rounded-md border border-border bg-background-primary p-4 dark:bg-[#0d1520]">
                  <span className="text-xs font-mono text-font-subtle dark:text-[#8da0b4]">
                    0{index + 1}
                  </span>
                  <span className="mt-4 text-sm font-semibold text-font dark:text-[#eaf2f8]">
                    {step}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <DeliveryItem
              icon={HiOutlineCloudArrowUp}
              title="Automated release"
              text="GitHub Actions installs dependencies, builds changed workspaces, applies migrations, and restarts the server process."
            />
            <DeliveryItem
              icon={HiOutlineServerStack}
              title="VPS runtime"
              text="Nginx serves the React app and proxies HTTP plus WebSocket traffic to the NestJS service managed by PM2."
            />
            <DeliveryItem
              icon={HiOutlineCircleStack}
              title="Database continuity"
              text="Prisma migrations keep PostgreSQL schema changes explicit and repeatable between local and production environments."
            />
          </div>
        </div>
      </SectionBand>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <div className="flex flex-col gap-5 rounded-lg border border-primary bg-[linear-gradient(135deg,rgba(36,129,204,0.12),rgba(22,163,74,0.08))] p-6 dark:bg-[linear-gradient(135deg,rgba(36,129,204,0.22),rgba(22,163,74,0.12))] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-font dark:text-[#f5f9fc]">
              Built as a working app, not a static demo.
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-font-subtle dark:text-[#b3c1ce]">
              Create two accounts, open separate sessions, and the system shows
              the core loop: messages, presence, delivery status, and realtime
              updates moving through the stack.
            </p>
          </div>
          <Link
            to="/register"
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-font-primary-contrast transition-colors hover:bg-primary-dark dark:text-white"
          >
            Try Telechat
          </Link>
        </div>
      </section>
    </main>
  );
};

const ProductPanel = () => (
  <div className="rounded-lg border border-border bg-elevation-contrast p-3 shadow-xl shadow-black/5 dark:bg-[#111b26] dark:shadow-black/30">
    <div className="rounded-md border border-border bg-background-primary dark:bg-[#0d1520]">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <img
            src="/logo_64.png"
            alt="Telechat"
            className="size-9 rounded-md bg-primary/10 p-1.5 dark:bg-[#173653]"
          />
          <div>
            <div className="text-sm font-semibold text-font dark:text-[#f5f9fc]">
              Telechat
            </div>
            <div className="text-xs text-font-subtle dark:text-[#9fb0c2]">
              Realtime workspace
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-icon-success" />
          <span className="text-xs font-medium text-font-subtle dark:text-[#aab8c6]">
            Online
          </span>
        </div>
      </div>

      <div className="grid min-h-[360px] grid-cols-1 sm:grid-cols-[0.92fr_1.35fr]">
        <aside className="hidden border-r border-border bg-elevation/70 p-3 dark:bg-[#101b28] sm:block">
          {['Dani', 'Product feedback', 'Deploy notes', 'Mobile test'].map(
            (chat, index) => (
              <div
                key={chat}
                className={`mb-2 rounded-md px-3 py-2 ${
                  index === 0
                    ? 'bg-primary text-font-primary-contrast dark:text-white'
                    : 'bg-background-primary text-font dark:bg-[#152130] dark:text-[#eaf2f8]'
                }`}
              >
                <div className="text-sm font-semibold">{chat}</div>
                <div
                  className={`mt-1 truncate text-xs ${
                    index === 0
                      ? 'text-font-primary-contrast/80 dark:text-white/78'
                      : 'text-font-subtle dark:text-[#9fb0c2]'
                  }`}
                >
                  {index === 0
                    ? 'New user onboarding is live'
                    : 'Socket updates synced'}
                </div>
              </div>
            ),
          )}
        </aside>

        <div className="flex flex-col p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-font dark:text-[#f5f9fc]">
                Dani
              </div>
              <div className="text-xs text-font-subtle dark:text-[#9fb0c2]">
                last seen recently
              </div>
            </div>
            <div className="rounded-md bg-primary/10 px-2.5 py-1 text-xs font-semibold text-font-primary dark:bg-[#12314a] dark:text-[#8fd0ff]">
              encrypted auth
            </div>
          </div>

          <div className="flex flex-1 flex-col justify-end gap-3">
            <Bubble align="left">
              Welcome to the app. This is the first chat every new account sees.
            </Bubble>
            <Bubble align="right">
              Nice. Messages, delivery state, and presence are all live?
            </Bubble>
            <Bubble align="left">
              Yes - the API, socket gateway, and local cache stay in sync.
            </Bubble>
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-md border border-border bg-elevation px-3 py-2 dark:bg-[#111b26]">
            <div className="h-2 flex-1 rounded-full bg-border dark:bg-[#2a3b4f]" />
            <HiOutlineBolt className="size-4 text-font-primary" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

const Bubble = ({
  align,
  children,
}: {
  align: 'left' | 'right';
  children: React.ReactNode;
}) => (
  <div
    className={`max-w-[84%] rounded-lg px-3 py-2 text-sm leading-6 ${
      align === 'right'
        ? 'ml-auto bg-primary text-font-primary-contrast dark:text-white'
        : 'mr-auto bg-elevation text-font dark:bg-[#172433] dark:text-[#eaf2f8]'
    }`}
  >
    {children}
  </div>
);

const SectionBand = ({
  eyebrow,
  title,
  description,
  children,
  muted = false,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
  muted?: boolean;
}) => (
  <section
    className={`border-t border-border ${
      muted
        ? 'bg-elevation/45 dark:bg-[#0f1823]'
        : 'bg-background-primary dark:bg-[#0b1118]'
    }`}
  >
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-7 max-w-3xl">
        <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-font-primary dark:text-[#8fd0ff]">
          {eyebrow}
        </div>
        <h2 className="text-2xl font-semibold leading-snug text-font dark:text-[#f5f9fc] sm:text-3xl">
          {title}
        </h2>
        <p className="mt-3 text-sm leading-6 text-font-subtle dark:text-[#b3c1ce] sm:text-base">
          {description}
        </p>
      </div>
      {children}
    </div>
  </section>
);

const CapabilityCard = ({ icon: Icon, title, description }: Capability) => (
  <article className="rounded-lg border border-border bg-elevation-contrast p-5 dark:bg-[#111b26]">
    <div className="mb-4 flex size-10 items-center justify-center rounded-md bg-primary/10 text-font-primary dark:bg-[#12314a] dark:text-[#8fd0ff]">
      <Icon className="size-5" />
    </div>
    <h3 className="text-base font-semibold text-font dark:text-[#f5f9fc]">
      {title}
    </h3>
    <p className="mt-2 text-sm leading-6 text-font-subtle dark:text-[#aab8c6]">
      {description}
    </p>
  </article>
);

const LayerCard = ({ eyebrow, title, description, points }: SystemLayer) => (
  <article className="rounded-lg border border-border bg-background-primary p-5 dark:bg-[#111b26]">
    <div className="mb-3 flex items-center justify-between gap-3">
      <span className="rounded-md bg-primary/10 px-2 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-font-primary dark:bg-[#12314a] dark:text-[#8fd0ff]">
        {eyebrow}
      </span>
      <HiOutlineSquares2X2 className="size-4 text-icon-subtle dark:text-[#8da0b4]" />
    </div>
    <h3 className="text-base font-semibold text-font dark:text-[#f5f9fc]">
      {title}
    </h3>
    <p className="mt-2 text-sm leading-6 text-font-subtle dark:text-[#aab8c6]">
      {description}
    </p>
    <ul className="mt-4 space-y-2">
      {points.map((point) => (
        <li
          key={point}
          className="flex items-center gap-2 text-sm text-font dark:text-[#e2ebf2]"
        >
          <HiOutlineCheckCircle className="size-4 shrink-0 text-icon-success" />
          {point}
        </li>
      ))}
    </ul>
  </article>
);

const StackBlock = ({ title, items }: StackGroup) => (
  <article className="rounded-lg border border-border bg-elevation-contrast p-5 dark:bg-[#111b26]">
    <div className="mb-4 flex items-center gap-2">
      {title === 'Backend' && (
        <HiOutlineCpuChip className="size-5 text-font-primary" />
      )}
      {title === 'Frontend' && (
        <HiOutlineWrenchScrewdriver className="size-5 text-font-primary" />
      )}
      {title === 'Operations' && (
        <HiOutlineServerStack className="size-5 text-font-primary" />
      )}
      <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-font dark:text-[#f5f9fc]">
        {title}
      </h3>
    </div>
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className="rounded-md border border-border bg-background-primary px-2.5 py-1.5 text-sm font-medium text-font-subtle dark:bg-[#0d1520] dark:text-[#b3c1ce]"
        >
          {item}
        </span>
      ))}
    </div>
  </article>
);

const DeliveryItem = ({
  icon: Icon,
  title,
  text,
}: {
  icon: IconType;
  title: string;
  text: string;
}) => (
  <div className="flex gap-3 rounded-md border border-border bg-background-primary p-4 dark:bg-[#0d1520]">
    <Icon className="mt-0.5 size-5 shrink-0 text-font-primary" />
    <div>
      <div className="text-sm font-semibold text-font dark:text-[#f5f9fc]">
        {title}
      </div>
      <p className="mt-1 text-xs leading-5 text-font-subtle dark:text-[#aab8c6]">
        {text}
      </p>
    </div>
  </div>
);

type Capability = {
  icon: IconType;
  title: string;
  description: string;
};

type SystemLayer = {
  eyebrow: string;
  title: string;
  description: string;
  points: string[];
};

type StackGroup = {
  title: 'Backend' | 'Frontend' | 'Operations';
  items: string[];
};
