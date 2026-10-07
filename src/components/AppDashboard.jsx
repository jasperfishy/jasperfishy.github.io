import { useEffect, useRef, useState } from "react";

const apps = [
  {
    id: "focusdrop",
    title: "FocusDrop",
    subtitle: "A tiny ADHD utility app to stay on track.",
    link: "https://focusdrop.jasperfish.com",
    description:
      "A lightweight, distraction-free companion app optimized for managing ADHD workflows, focusing task execution, and breaking down mental drag.",
    tags: ["React", "Tailwind CSS", "GitHub Pages"],
    isFeatured: true,
  },
];

const cardBase =
  "group relative isolate flex min-w-0 flex-col overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-md transition-[transform,border-color,box-shadow] duration-300 ease-out motion-safe:hover:scale-[1.015] motion-reduce:transition-none";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 focus-visible:ring-offset-4 focus-visible:ring-offset-zinc-900";

function Icon({ name, className = "h-5 w-5" }) {
  const paths = {
    arrow: <path d="M7 17 17 7M7 7h10v10" />,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    check: <path d="m5 12 4 4L19 6" />,
    layers: (
      <path d="m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5" />
    ),
    focus: (
      <>
        <circle cx="12" cy="12" r="7" />
        <circle cx="12" cy="12" r="2" />
        <path d="M12 2v3m0 14v3M2 12h3m14 0h3" />
      </>
    ),
    bridge: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="3" />
        <path d="m3 7 9 6 9-6" />
      </>
    ),
    sparkle: (
      <path d="m12 3 2.3 6.7L21 12l-6.7 2.3L12 21l-2.3-6.7L3 12l6.7-2.3L12 3Z" />
    ),
  };

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {paths[name] || paths.layers}
    </svg>
  );
}

function AppModal({ app, onClose }) {
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);
  const pointerStartedOutside = useRef(false);

  useEffect(() => {
    if (!app) return;

    const dialog = dialogRef.current;
    const opener = document.activeElement;
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    dialog.showModal();
    closeButtonRef.current?.focus();

    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;

      if (opener instanceof HTMLElement && opener.isConnected) {
        opener.focus({ preventScroll: true });
      }
    };
  }, [app]);

  if (!app) return null;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="app-modal-title"
      aria-describedby="app-modal-description"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onPointerDown={(event) => {
        pointerStartedOutside.current =
          event.target === event.currentTarget;
      }}
      onClick={(event) => {
        // Only dismiss when the interaction starts and ends outside the box.
        if (
          event.target === event.currentTarget &&
          pointerStartedOutside.current
        ) {
          onClose();
        }
        pointerStartedOutside.current = false;
      }}
      className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none bg-transparent p-4 text-zinc-100 backdrop:bg-black/75 backdrop:backdrop-blur-sm open:flex open:items-center open:justify-center sm:p-8"
    >
      <div className="flex max-h-full w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl shadow-black/50">
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-zinc-800 px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <h2
              id="app-modal-title"
              className="truncate text-base font-semibold tracking-tight"
            >
              {app.title}
            </h2>
            <p
              id="app-modal-description"
              className="mt-1 text-xs text-zinc-400"
            >
              {app.subtitle}
            </p>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label={`Close ${app.title} window`}
            title="Close window"
            className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-800/70 text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white ${focusRing}`}
          >
            <Icon name="close" />
          </button>
        </header>

        <div className="h-[72dvh] min-h-0 shrink bg-zinc-950">
          <iframe
            key={app.id}
            src={app.link}
            title={`${app.title} application`}
            referrerPolicy="strict-origin-when-cross-origin"
            allow="fullscreen"
            className="block h-full w-full border-0"
          />
        </div>

        <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-zinc-800 px-4 py-3 sm:px-6">
          <p className="text-xs text-zinc-400">
            If the app cannot load here, open it directly.
          </p>
          <a
            href={app.link}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-2 rounded-md px-1 py-1 text-xs font-medium text-violet-300 transition-colors hover:text-violet-200 ${focusRing}`}
          >
            Open in new tab
            <Icon name="arrow" className="h-3.5 w-3.5" />
          </a>
        </footer>
      </div>
    </dialog>
  );
}

function FocusArtwork() {
  return (
    <div
      aria-hidden="true"
      className="relative my-8 flex min-h-56 flex-1 items-center justify-center overflow-hidden rounded-2xl border border-white/5 bg-zinc-950/60 p-6"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.08)_1px,transparent_0)] bg-size-[20px_20px]" />
      <div className="absolute h-48 w-48 rounded-full bg-violet-500/15 blur-3xl" />

      <div className="relative w-full max-w-xs rounded-2xl border border-zinc-700/70 bg-zinc-900/95 p-5 shadow-2xl transition-transform duration-500 motion-safe:group-hover:-translate-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-400">
            A little less overwhelm
          </span>
          <Icon name="focus" className="h-4 w-4 text-violet-300" />
        </div>

        <p className="mt-4 text-xl font-semibold tracking-tight text-zinc-100">
          One thing at a time.
        </p>

        <div className="mt-5 flex items-center gap-3 rounded-xl border border-violet-400/20 bg-violet-400/10 p-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-400/20 text-violet-200">
            <Icon name="check" className="h-3.5 w-3.5" />
          </span>
          <span className="text-sm text-violet-100">
            Start with one small step
          </span>
        </div>

        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-zinc-800">
          <div className="h-full w-2/3 rounded-full bg-linear-to-r from-violet-500 to-violet-300" />
        </div>
        <p className="mt-3 text-xs text-zinc-500">
          Small steps. Steady momentum.
        </p>
      </div>
    </div>
  );
}

function AppCard({ app, onLaunch }) {
  const featured = app.isFeatured;

  return (
    <article
      aria-labelledby={`app-title-${app.id}`}
      className={`${cardBase} ${
        featured
          ? "min-h-128 hover:border-violet-400/50 hover:shadow-[0_0_40px_-12px_rgba(139,92,246,0.4)] focus-within:border-violet-400/50 md:col-span-2 md:row-span-2 md:p-8"
          : "min-h-72 hover:border-cyan-400/50 hover:shadow-[0_0_40px_-12px_rgba(34,211,238,0.3)] focus-within:border-cyan-400/50"
      }`}
    >
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute -right-16 -top-16 -z-10 h-56 w-56 rounded-full blur-3xl ${
          featured ? "bg-violet-500/15" : "bg-cyan-500/10"
        }`}
      />

      <div className="flex items-center justify-between gap-4">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${
            featured
              ? "border-violet-400/20 bg-violet-400/10 text-violet-300"
              : "border-cyan-400/20 bg-cyan-400/10 text-cyan-300"
          }`}
        >
          <Icon
            name={featured ? "focus" : "bridge"}
            className="h-6 w-6"
          />
        </div>

        {featured ? (
          <span className="inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1 text-xs font-medium text-violet-200">
            <Icon name="sparkle" className="h-3.5 w-3.5" />
            Featured
          </span>
        ) : (
          <span className="font-mono text-[10px] tracking-widest text-zinc-500">
            INTEGRATION
          </span>
        )}
      </div>

      <h2
        id={`app-title-${app.id}`}
        className={`mt-6 font-semibold tracking-tight ${
          featured ? "text-3xl sm:text-4xl" : "text-xl"
        }`}
      >
        {app.title}
      </h2>

      <p
        className={`mt-2 font-medium ${
          featured ? "text-base text-violet-200" : "text-sm text-cyan-200"
        }`}
      >
        {app.subtitle}
      </p>

      <p
        className={`mt-3 text-pretty leading-relaxed text-zinc-400 ${
          featured ? "max-w-lg text-base" : "text-sm"
        }`}
      >
        {app.description}
      </p>

      {featured && <FocusArtwork />}

      <ul
        aria-label={`${app.title} technologies`}
        className={`flex flex-wrap gap-2 ${featured ? "" : "mt-5"}`}
      >
        {app.tags.map((tag) => (
          <li
            key={tag}
            className="rounded-md border border-white/5 bg-white/3 px-2 py-1 text-[11px] font-medium text-zinc-400"
          >
            {tag}
          </li>
        ))}
      </ul>

      <div className={featured ? "mt-6" : "mt-auto pt-6"}>
        <button
          type="button"
          onClick={() => onLaunch(app)}
          aria-haspopup="dialog"
          aria-label={`Launch ${app.title} in an app window`}
          className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-medium transition-colors ${focusRing} ${
            featured
              ? "bg-zinc-100 text-zinc-950 hover:bg-white"
              : "border border-zinc-700/70 bg-white/5 text-zinc-200 hover:bg-white/10"
          }`}
        >
          Launch App
          <Icon name="arrow" className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}

export default function AppDashboard() {
  const [activeApp, setActiveApp] = useState(null);
  const [showStack, setShowStack] = useState(false);
  const technologies = [...new Set(apps.flatMap((app) => app.tags))];

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-zinc-950 font-sans text-zinc-100 antialiased selection:bg-violet-500/30">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-64 -z-10 mx-auto h-128 max-w-4xl rounded-full bg-violet-600/8 blur-[120px]"
      />

      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-16">
        <header className="mb-10 sm:mb-14">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <span className="flex items-center gap-3 text-sm font-semibold tracking-tight">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900">
                <Icon name="layers" className="h-4 w-4 text-violet-300" />
              </span>
              App Portfolio
              <span className="font-normal text-zinc-600">/</span>
              <span className="font-normal text-zinc-400">Collection</span>
            </span>

            <span className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-xs text-zinc-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {apps.length} projects to explore
            </span>
          </div>

          <p className="mb-4 text-xs font-medium uppercase tracking-[0.22em] text-violet-300">
            Small apps. Thoughtful experiences.
          </p>
          <h1 className="max-w-3xl text-4xl font-semibold leading-[1.1] tracking-tight sm:text-6xl">
            A collection of
            <br />
            <span className="bg-linear-to-r from-zinc-100 via-zinc-300 to-zinc-500 bg-clip-text text-transparent">
              useful little things.
            </span>
          </h1>
          <p className="mt-5 max-w-lg text-pretty text-sm leading-7 text-zinc-400 sm:text-base">
            I build focused tools that reduce friction, connect ideas,
            and make everyday workflows feel a little lighter.
          </p>
        </header>

        <section
          aria-label="Application collection"
          className="grid grid-cols-1 gap-6 md:grid-cols-3"
        >
          {apps.map((app) => (
            <AppCard key={app.id} app={app} onLaunch={setActiveApp} />
          ))}

          <article
            aria-labelledby="collection-heading"
            className={`${cardBase} min-h-64 hover:border-violet-400/50 hover:shadow-[0_0_40px_-12px_rgba(139,92,246,0.4)] focus-within:border-violet-400/50`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-zinc-700 bg-linear-to-br from-zinc-700 to-zinc-900">
                <Icon name="sparkle" className="text-zinc-200" />
              </div>
              <span className="text-xs text-zinc-500">
                Behind the collection
              </span>
            </div>

            <h2
              id="collection-heading"
              className="mt-6 text-xl font-semibold tracking-tight"
            >
              Built for the curious.
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              Small utilities, thoughtful interfaces, and an interest in
              making technology more useful.
            </p>

            <div
              id="collection-stats"
              aria-live="polite"
              aria-atomic="true"
              className="mt-6 border-t border-zinc-800 pt-5"
            >
              <p className="text-3xl font-semibold tracking-tight">
                {showStack ? technologies.length : apps.length}
                <span className="text-violet-400">.</span>
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                {showStack ? "Unique technologies" : "Projects in collection"}
              </p>
            </div>

            <button
              type="button"
              aria-pressed={showStack}
              aria-controls="collection-stats"
              onClick={() => setShowStack((current) => !current)}
              className={`mt-5 self-start rounded-lg px-1 py-2 text-xs font-medium text-violet-300 transition-colors hover:text-violet-200 ${focusRing}`}
            >
              {showStack ? "View project count" : "Explore the stack"}
              <span aria-hidden="true" className="ml-2">→</span>
            </button>
          </article>
        </section>

        <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800/70 pt-6 text-xs text-zinc-500">
          <p>A little curiosity goes a long way.</p>
          <p>Designed to explore. Built for the web.</p>
        </footer>
      </div>

      <AppModal app={activeApp} onClose={() => setActiveApp(null)} />
    </main>
  );
}
