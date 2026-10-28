import { useEffect, useRef, useState } from "react";
import apps from "../data/apps.json";

const APP_URL = "https://focusdrop.jasperfish.com";

function Icon({ name, className = "" }) {
  const shapes = {
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
    external: <path d="M14 4h6v6m0-6L10 14m0-10H4v16h16v-6" />,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    plus: <path d="M12 5v14M5 12h14" />,
    check: <path d="m5 12 4 4L19 6" />,
    moon: <path d="M20.7 13A9 9 0 0 1 11 3.3 9 9 0 1 0 20.7 13Z" />,
    device: (
      <>
        <rect x="4" y="3" width="16" height="12" rx="2" />
        <path d="M8 21h8m-4-6v6" />
      </>
    ),
    return: (
      <>
        <path d="M4 9a8 8 0 1 1 0 6M4 3v6h6" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    down: <path d="m6 9 6 6 6-6" />,
  };
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`icon ${className}`}
      aria-hidden="true"
    >
      {shapes[name]}
    </svg>
  );
}

function FishMark() {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
      className="fish-mark"
    >
      <path
        d="M5 20C12 9 23 9 30 17l6-5v16l-6-5C23 31 12 31 5 20Z"
        fill="currentColor"
      />
      <circle cx="14" cy="18" r="1.8" fill="#0c1729" />
      <path d="m21 14-4 6 4 6" stroke="#0c1729" strokeWidth="1.5" />
    </svg>
  );
}

function DropMark() {
  return (
    <svg
      viewBox="0 0 40 48"
      fill="none"
      aria-hidden="true"
      className="drop-mark"
    >
      <path
        d="M20 3C16 12 4 23 4 31a16 16 0 0 0 32 0C36 23 24 12 20 3Z"
        fill="currentColor"
      />
      <path
        d="M12 30a8 8 0 0 0 8 9"
        stroke="white"
        strokeOpacity=".7"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

const initialThoughts = [
  {
    id: "book",
    text: "That book someone recommended",
    tag: "An idea for later",
    tone: "blue",
  },
  {
    id: "walk",
    text: "Go outside for ten minutes",
    tag: "One small thing",
    tone: "peach",
  },
];

function CaptureDemo() {
  const [thought, setThought] = useState("");
  const [thoughts, setThoughts] = useState(initialThoughts);
  const [message, setMessage] = useState(
    "A little preview. Nothing here is saved.",
  );
  const inputRef = useRef(null);
  function capture(event) {
    event.preventDefault();
    const text = thought.trim();
    if (!text) {
      inputRef.current?.focus();
      return;
    }
    setThoughts((current) =>
      [
        { id: crypto.randomUUID(), text, tag: "Just dropped", tone: "blue" },
        ...current,
      ].slice(0, 3),
    );
    setThought("");
    setMessage("Thought caught. This is a demo; open FocusDrop to keep it.");
    inputRef.current?.focus();
  }
  function letGo(id) {
    setThoughts((current) => current.filter((item) => item.id !== id));
    setMessage("Let it go. A little more headspace.");
  }
  return (
    <div className="demo-wrap">
      <div className="demo-window">
        <div className="demo-topbar">
          <span>
            <span />
            <span />
            <span />
          </span>
          <span>Try a little headspace</span>
          <Icon name="moon" />
        </div>
        <div className="demo-content">
          <div className="demo-title">
            <DropMark />
            <h3>FocusDrop</h3>
          </div>
          <p className="demo-subtitle">
            Drop it. Don’t decide. It’ll come back around.
          </p>
          <form className="capture-form" onSubmit={capture}>
            <label htmlFor="demo-thought" className="sr-only">
              Try dropping a thought
            </label>
            <input
              ref={inputRef}
              id="demo-thought"
              placeholder="What’s on your mind?"
              value={thought}
              maxLength={160}
              autoComplete="off"
              onChange={(event) => setThought(event.target.value)}
            />
            <button type="submit" aria-label="Drop your demo thought">
              <Icon name="plus" />
              <span>Drop</span>
            </button>
          </form>
          <div className="demo-list-heading">
            <span>
              {thoughts.length} {thoughts.length === 1 ? "thought" : "thoughts"}{" "}
              floating here
            </span>
            <button
              className="text-button"
              onClick={() => {
                setThoughts(initialThoughts);
                setThought("");
                setMessage("Demo reset. Try dropping a thought.");
              }}
            >
              Reset demo
            </button>
          </div>
          <ul className="thought-list">
            {thoughts.map((item) => (
              <li className={`thought-card ${item.tone}`} key={item.id}>
                <div>
                  <span className="thought-tag">{item.tag}</span>
                  <p>{item.text}</p>
                </div>
                <button
                  onClick={() => letGo(item.id)}
                  aria-label={`Let go of ${item.text}`}
                  title="Let it go"
                >
                  <Icon name="check" />
                </button>
              </li>
            ))}
          </ul>
          {thoughts.length === 0 && (
            <p className="demo-empty">
              A clear little space. Drop something in whenever you’re ready.
            </p>
          )}
          <p className="demo-message" role="status">
            {message}
          </p>
        </div>
      </div>
      <p className="demo-footnote">
        Go on, try it. Even a half-formed thought is welcome.
      </p>
    </div>
  );
}

function AppModal({ onClose }) {
  const dialogRef = useRef(null);
  const closeRef = useRef(null);
  const pointerOutside = useRef(false);
  useEffect(() => {
    const dialog = dialogRef.current;
    const opener = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    closeRef.current?.focus();
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      if (opener instanceof HTMLElement && opener.isConnected)
        opener.focus({ preventScroll: true });
    };
  }, []);
  return (
    <dialog
      ref={dialogRef}
      className="app-modal"
      aria-labelledby="modal-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onPointerDown={(event) => {
        pointerOutside.current = event.target === event.currentTarget;
      }}
      onClick={(event) => {
        if (pointerOutside.current && event.target === event.currentTarget)
          onClose();
        pointerOutside.current = false;
      }}
    >
      <div className="modal-panel">
        <header>
          <div className="modal-brand">
            <DropMark />
            <h2 id="modal-title">FocusDrop</h2>
          </div>
          <button
            ref={closeRef}
            className="close-button"
            onClick={onClose}
            aria-label="Close FocusDrop window"
          >
            <Icon name="close" />
          </button>
        </header>
        <iframe
          src={APP_URL}
          title="FocusDrop application"
          referrerPolicy="strict-origin-when-cross-origin"
          allow="fullscreen"
        />
        <footer>
          <p>Your own little space to think.</p>
          <a href={APP_URL} target="_blank" rel="noopener noreferrer">
            Open in new tab <Icon name="external" />
          </a>
        </footer>
      </div>
    </dialog>
  );
}

export default function AppDashboard() {
  const [appOpen, setAppOpen] = useState(false);
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <div className="site-shell">
        <header className="site-header">
          <a className="wordmark" href="#" aria-label="Jasperfish home">
            <FishMark />
            <span>
              jasperfish<span className="wordmark-dot">.</span>
            </span>
          </a>
          <nav aria-label="Main navigation">
            <a href="#apps">The apps</a>
            <a href="#about">The idea</a>
            <a
              className="nav-github"
              href="https://github.com/jasperfishy"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub <Icon name="external" />
            </a>
          </nav>
        </header>
        <main id="main">
          <section id="apps" className="app-directory" aria-labelledby="apps-title">
            <div className="directory-intro">
              <p>Small apps, made with care.</p>
              <h1 id="apps-title">A little focus.<br />A little play.</h1>
              <p>A home for all my apps. Find something useful, something playful,
                or a new little world to explore.</p>
            </div>
            <div className="directory-heading"><h2>Explore the apps</h2><span>{apps.length} apps to discover</span></div>
            <div className="app-catalogue">
              {apps.map(app => (
                <article className={'catalogue-card ' + (app.id === 'dino' ? 'catalogue-play' : '')} key={app.id}>
                  <div className="catalogue-identity">
                    {app.icon ? <img src={app.icon} alt="" width="72" height="72" /> : <span className="catalogue-icon"><DropMark /></span>}
                    <div><p>{app.category}</p><h3>{app.name}</h3></div>
                  </div>
                  <p className="catalogue-description">{app.description}</p>
                  <a className="button button-primary" href={app.url}>Open {app.name}<Icon name="arrow" /></a>
                </article>
              ))}
            </div>
            <p className="directory-note">Choose an app to open it. Each has its own place to play or work.</p>
          </section>
          <section
            id="focusdrop"
            className="project-section"
            aria-labelledby="focusdrop-title"
          >
            <div className="section-heading">
              <span>A closer look at FocusDrop</span>
              <span className="project-status">
                <span />
                Ready when you are
              </span>
            </div>
            <div className="project-grid">
              <div className="project-copy">
                <div className="app-identity">
                  <span className="app-icon">
                    <DropMark />
                  </span>
                  <div>
                    <h2 id="focusdrop-title">FocusDrop</h2>
                    <span>A softer place for your thoughts.</span>
                  </div>
                </div>
                <h3>
                  Catch the thought.
                  <br />
                  Skip the pressure.
                </h3>
                <p>
                  A task, an idea, that thing you don’t want to forget. Drop it
                  somewhere safe, without turning it into another to-do list.
                </p>
                <p>
                  Designed with ADHD brains in mind. Come back to one small
                  thing when you have the space.
                </p>
                <div className="project-actions">
                  <button
                    className="button button-primary"
                    aria-haspopup="dialog"
                    onClick={() => setAppOpen(true)}
                  >
                    Open FocusDrop <Icon name="arrow" />
                  </button>
                  <a
                    className="install-link"
                    href={`${APP_URL}/?install=1`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Icon name="device" />
                    Install the app
                  </a>
                </div>
                <p className="app-facts">Free to use. No account needed.</p>
              </div>
              <CaptureDemo />
            </div>
            <div className="benefits">
              <article>
                <Icon name="plus" />
                <h3>Capture before it slips away.</h3>
                <p>
                  No categories to choose. No perfect wording. Just get the
                  thought out of your head.
                </p>
              </article>
              <article>
                <Icon name="return" />
                <h3>Come back on your terms.</h3>
                <p>
                  Resurface a thought, take a tiny first step, or snooze it for
                  another moment.
                </p>
              </article>
              <article>
                <Icon name="moon" />
                <h3>A little less to carry.</h3>
                <p>
                  Low energy days count too. Keep things small, or let a thought
                  go altogether.
                </p>
              </article>
            </div>
          </section>
          <section
            id="about"
            className="about-section"
            aria-labelledby="about-title"
          >
            <div>
              <span className="about-symbol" aria-hidden="true">
                <FishMark />
              </span>
              <h2 id="about-title">Small on purpose.</h2>
              <p>
                Jasperfish is my home for useful little apps. I build things
                that solve an everyday problem, feel good to use, and know when
                to get out of the way.
              </p>
              <p>
                From a quiet place to collect your thoughts to a colourful world
                for little dinosaur explorers, every app starts with someone
                who could use it.
              </p>
              <a
                className="inline-link"
                href="https://github.com/jasperfishy"
                target="_blank"
                rel="noopener noreferrer"
              >
                See what I’m building <Icon name="external" />
              </a>
            </div>
            <div className="questions">
              <h3>A few things to know</h3>
              <details>
                <summary>
                  Can I use FocusDrop on my phone?
                  <Icon name="down" />
                </summary>
                <p>
                  Yes. Open it in your browser, or use “Install the app” for
                  guidance on adding it to your phone or desktop. Once installed
                  and loaded, it works offline too.
                </p>
              </details>
              <details>
                <summary>
                  Where do my thoughts go?
                  <Icon name="down" />
                </summary>
                <p>
                  FocusDrop stores your thoughts in the browser on the device
                  you’re using. There’s no account to create. Browser data can
                  be cleared, so use the app’s export option for a backup.
                </p>
              </details>
              <details>
                <summary>
                  Is this a task manager?
                  <Icon name="down" />
                </summary>
                <p>
                  Think of it as a place to capture and revisit things. You can
                  take a small first step, snooze something, or let it go. You
                  don’t have to organise your whole life first.
                </p>
              </details>
            </div>
          </section>
        </main>
        <footer className="site-footer">
          <a className="wordmark" href="#" aria-label="Jasperfish home">
            <FishMark />
            <span>jasperfish.</span>
          </a>
          <p>A little curiosity. A little more headspace.</p>
          <a href="#apps">
            Explore all apps <Icon name="arrow" />
          </a>
        </footer>
      </div>
      {appOpen && <AppModal onClose={() => setAppOpen(false)} />}
    </>
  );
}
