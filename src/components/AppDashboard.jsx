import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import diveFilm from "../assets/marianas-film.mp4";
import mobileDiveFilm from "../assets/marianas-small.mp4";
import divePoster from "../assets/marianas-poster.webp";
import "../tidal.css";
import "../premium.css";
import dinoHub from "../assets/dino-hub.jpg";
import dinoPark from "../assets/dino-park.jpg";
import dinoMeadow from "../assets/dino-meadow.jpg";
import dinoDrive from "../assets/dino-drive.jpg";
import dinoAdventures from "../assets/dino-adventures.jpg";
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
    hand: <path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11m0-1.5a1.5 1.5 0 0 1 3 0V11m0-.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-.5a6 6 0 0 1-5-2.7L3.7 15a1.5 1.5 0 0 1 2.4-1.8L8 15" />,
    shield: <path d="M12 3 5 6v5c0 4.5 3 8.3 7 10 4-1.7 7-5.5 7-10V6l-7-3Zm-3 9 2 2 4-4" />,
    wifi: (
      <>
        <path d="M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0" />
        <circle cx="12" cy="19.5" r=".8" fill="currentColor" />
      </>
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

const DINO_URL = "/dino/";

const CARD_FACTS = {
  focusdrop: ["Free", "No account", "Works offline"],
  dino: ["Free", "No ads", "No accounts", "Works offline"],
};

const DINO_WORLDS = [
  { id: "park", name: "Dino Park", count: "13 games", image: dinoPark, alt: "Dino Dash: a green dinosaur jumps a log while collecting a trail of stars", text: "Rebuild skeletons bone by bone, dig for fossils, dash, catch eggs and paint." },
  { id: "meadow", name: "Dino Meadow", count: "20 game types", image: dinoMeadow, alt: "Dino music: three dinosaurs beside a colourful xylophone playing Hot Cross Buns", text: "Gentle counting, colours, shapes, music and a 120-page colouring book." },
  { id: "drive", name: "Dino Car Studio", count: "6 worlds", image: dinoDrive, alt: "A red dino car races a rival along a mountain road with snowy peaks", text: "Paint a car, then race rival dinos along curving roads through six worlds." },
  { id: "adventures", name: "Dino Adventures", count: "23 adventures", image: dinoAdventures, alt: "The Great Dino Rescue map: a T-rex at home with seven chapters along a mountain path", text: "Hatch, build and rescue, with story quests and a 48-sticker album." },
];

function useHeaderState() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return scrolled;
}

// Sections ease in as they scroll into view. Without JavaScript, or with
// reduced motion, everything is simply visible.
function useReveal() {
  useEffect(() => {
    const motionOK = window.matchMedia("(prefers-reduced-motion: no-preference)").matches;
    if (!motionOK || !("IntersectionObserver" in window)) return undefined;
    const root = document.documentElement;
    root.classList.add("reveal-ready");
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add("is-visible"); io.unobserve(entry.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    document.querySelectorAll("[data-reveal]").forEach((el) => io.observe(el));
    return () => { io.disconnect(); root.classList.remove("reveal-ready"); };
  }, []);
}

function FocusArt() {
  return (
    <div className="card-art card-art-focus" aria-hidden="true">
      <span className="focus-orb" />
      <span className="focus-drop"><DropMark /></span>
      <span className="focus-chip chip-a">An idea for later</span>
      <span className="focus-chip chip-b">One small thing</span>
    </div>
  );
}

function DinoArt() {
  return (
    <div className="card-art card-art-dino" aria-hidden="true">
      <img src={dinoHub} alt="" loading="lazy" width="968" height="400" />
    </div>
  );
}

function DinoSection() {
  return (
    <section id="dinosaur-universe" className="project-section dino-section" aria-labelledby="dino-title" data-reveal>
      <div className="section-heading">
        <span>A closer look at Dinosaur Universe</span>
        <span className="project-status"><span />Free for little explorers</span>
      </div>
      <div className="dino-intro">
        <div className="project-copy">
          <div className="app-identity">
            <img className="app-icon-img" src="/dino/icon-192.png" alt="" width="48" height="48" />
            <div>
              <h2 id="dino-title">Dinosaur Universe</h2>
              <span>A colourful world for little explorers.</span>
            </div>
          </div>
          <h3>
            Four worlds.
            <br />
            Endless small adventures.
          </h3>
          <p>
            Rebuild a skeleton, race a painted dino car, play a tune on a
            xylophone or rescue Mummy and Daddy from the storm. Every game is
            made of big friendly buttons, gentle hints and plenty of stars.
          </p>
          <div className="project-actions">
            <a className="button button-primary" href={DINO_URL}>
              Open Dinosaur Universe <Icon name="arrow" />
            </a>
            <span className="install-hint"><Icon name="device" />Add it to a tablet’s home screen</span>
          </div>
          <p className="app-facts">Free to play. No ads, no accounts, nothing to buy.</p>
        </div>
        <figure className="dino-device">
          <div className="device-frame">
            <img src={dinoHub} alt="The Dinosaur Universe home: Rex the T-rex says hello beside palm trees and a volcano" loading="lazy" width="968" height="400" />
          </div>
          <figcaption>The home of Dinosaur Universe, where every world begins.</figcaption>
        </figure>
      </div>
      <ul className="dino-worlds">
        {DINO_WORLDS.map((world, index) => (
          <li className="world-card" key={world.id} data-reveal style={{ "--reveal-delay": `${index * 70}ms` }}>
            <a href={DINO_URL} aria-label={`${world.name}: ${world.count}. Open Dinosaur Universe`}>
              <span className="world-shot"><img src={world.image} alt={world.alt} loading="lazy" /></span>
              <span className="world-body">
                <span className="world-count">{world.count}</span>
                <strong>{world.name}</strong>
                <span>{world.text}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
      <div className="benefits">
        <article>
          <Icon name="hand" />
          <h3>Made for little hands.</h3>
          <p>Big buttons, simple taps and drags, gentle hints and kind retries. Lots of praise and stars, never a scary game over.</p>
        </article>
        <article>
          <Icon name="shield" />
          <h3>Grown-ups stay in charge.</h3>
          <p>A parents panel sets the sound, the difficulty, spoken instructions and calmer celebrations.</p>
        </article>
        <article>
          <Icon name="wifi" />
          <h3>Ready for the car.</h3>
          <p>Once it has loaded, it keeps working offline. Progress is saved on the device you play on.</p>
        </article>
      </div>
    </section>
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

export default function AppDashboard() {
  const landingRef = useRef(null);
  const scrolled = useHeaderState();
  useReveal();

  useEffect(() => {
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const context = gsap.context(() => {
        const intro = gsap.timeline({ defaults: { ease: "power2.out" } });
        intro.from(".hero-kicker, .hero-title-line, .hero-lede, .hero-actions", {
          y: 14, duration: 0.65, stagger: 0.07, clearProps: "transform",
        });
      }, landingRef);
      return () => context.revert();
    });
    return () => media.revert();
  }, []);

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <div className="site-shell">
        <header className={`site-header${scrolled ? " is-scrolled" : ""}`}>
          <a className="wordmark" href="#" aria-label="Jasperfish home">
            <FishMark />
            <span>
              jasperfish<span className="wordmark-dot">.</span>
            </span>
          </a>
          <nav aria-label="Main navigation">
            <a href="#app-catalogue">The apps</a>
            <a href="#dinosaur-universe">Dinosaurs</a>
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
          <section id="apps" className="app-directory" aria-labelledby="apps-title" ref={landingRef}>
            <div className="landing-hero">
              <div className="hero-copy">
                <p className="hero-kicker"><span/> The Jasperfish collection</p>
                <h1 id="apps-title">
                  <span className="hero-title-line">Small apps.</span>
                  <em className="hero-title-line">Bright little </em>
                  <em className="hero-title-line">worlds.</em>
                </h1>
                <p className="hero-lede">A quiet place to catch a thought. A dinosaur world to get lost in. Pick a current and see where it takes you.</p>
                <div className="hero-actions"><a className="button button-primary" href="#app-catalogue">Explore the apps <Icon name="down"/></a></div>
              </div>
              <a className="hero-scroll" href="#app-catalogue" aria-label="Scroll to the apps"><span>Scroll</span><i /></a>
              <p className="hero-credit">Film: <a href="https://oceanexplorer.noaa.gov/multimedia/video-playlist-best-jellyfish/" target="_blank" rel="noopener noreferrer">NOAA Ocean Exploration</a>, Marianas 2016</p>
              <div className="hero-film" aria-hidden="true">
                <video autoPlay muted playsInline loop preload="auto" poster={divePoster} disablePictureInPicture>
                  <source media="(max-width: 650px)" src={mobileDiveFilm} type="video/mp4" />
                  <source src={diveFilm} type="video/mp4" />
                </video>
              </div>
            </div>
            <div className="directory-heading" id="app-catalogue" data-reveal><div><p className="folio">01 / Directory</p><h2>Choose your current.</h2></div><span>{String(apps.length).padStart(2, "0")} apps</span></div>
            <div className="app-catalogue">
              {apps.map((app, index) => (
                <article className={'catalogue-card ' + (app.id === 'dino' ? 'catalogue-play' : '')} key={app.id} data-reveal style={{ "--reveal-delay": `${index * 90}ms` }}>
                  {app.id === "dino" ? <DinoArt /> : <FocusArt />}
                  <span className="card-index">No. {String(index + 1).padStart(2, "0")}</span>
                  <div className="catalogue-identity">
                    {app.icon ? <img src={app.icon} alt="" width="72" height="72" /> : <span className="catalogue-icon"><DropMark /></span>}
                    <div><p>{app.category}</p><h3>{app.name}</h3></div>
                  </div>
                  <p className="catalogue-description">{app.description}</p>
                  <ul className="card-facts" aria-label={`${app.name} at a glance`}>
                    {(CARD_FACTS[app.id] || []).map((fact) => <li key={fact}>{fact}</li>)}
                  </ul>
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
            data-reveal
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
                  <a
                    className="button button-primary"
                    href={APP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open FocusDrop <Icon name="arrow" />
                  </a>
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
          <DinoSection />
          <section
            id="about"
            className="about-section"
            aria-labelledby="about-title"
            data-reveal
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
              <details>
                <summary>
                  Is Dinosaur Universe OK for young children?
                  <Icon name="down" />
                </summary>
                <p>
                  It was made for a little dinosaur fan. There are no ads, no
                  accounts and nothing to buy. Progress stays on the device it’s
                  played on, and a parents panel sets the sound, the difficulty and
                  calmer celebrations.
                </p>
              </details>
              <details>
                <summary>
                  Can we play Dinosaur Universe on a tablet?
                  <Icon name="down" />
                </summary>
                <p>
                  Yes. Open jasperfish.com/dino in the tablet’s browser and add it
                  to the home screen, and it opens like an app. After the first
                  visit it keeps working without internet, which helps on journeys.
                </p>
              </details>
            </div>
          </section>
        </main>
        <footer className="site-footer site-footer-rich">
          <div className="footer-brand">
            <a className="wordmark" href="#" aria-label="Jasperfish home">
              <FishMark />
              <span>jasperfish.</span>
            </a>
            <p>A little curiosity. A little more headspace.</p>
          </div>
          <nav className="footer-links" aria-label="Footer">
            <div>
              <h2>Apps</h2>
              <a href={APP_URL} target="_blank" rel="noopener noreferrer">FocusDrop</a>
              <a href={DINO_URL}>Dinosaur Universe</a>
            </div>
            <div>
              <h2>Jasperfish</h2>
              <a href="#about">The idea</a>
              <a href="https://github.com/jasperfishy" target="_blank" rel="noopener noreferrer">GitHub</a>
            </div>
          </nav>
          <p className="footer-fine">
            © {new Date().getFullYear()} Jasperfish. Opening film courtesy of{" "}
            <a href="https://oceanexplorer.noaa.gov/multimedia/video-playlist-best-jellyfish/" target="_blank" rel="noopener noreferrer">NOAA Ocean Exploration</a>.
          </p>
        </footer>
      </div>
    </>
  );
}
