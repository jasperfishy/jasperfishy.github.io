// ============ 1. Jigsaw — Dino Puzzle (adapted from iabuzz Puzzle4KidsDinos style jigsaw) ============
register({
  id: "jigsaw", name: "Dino Puzzle", emoji: "🧩",
  init(area) {
    const size = 3; // 3x3 for toddlers
    const dino = pick(DINOS);
    area.innerHTML = `
      <div class="big-emoji">${dino}</div>
      <div class="message">Put the pieces in the tray!</div>
      <div class="board" id="board" style="grid-template-columns:repeat(${size},72px);"></div>
      <div class="tray" id="tray"></div>`;
    const board = $("#board"), tray = $("#tray");
    const cells = [];
    for (let i = 0; i < size * size; i++) {
      const s = document.createElement("div");
      s.className = "slot"; s.dataset.i = i;
      s.textContent = dino;
      s.style.opacity = ".25";
      board.appendChild(s); cells.push(s);
    }
    shuffle(cells.map(c => +c.dataset.i)).forEach(i => {
      const p = document.createElement("div");
      p.className = "pc"; p.dataset.i = i; p.textContent = dino;
      p.onclick = () => {
        if (p.classList.contains("used")) return;
        const slot = cells[+p.dataset.i];
        if (slot.classList.contains("filled")) return;
        slot.classList.add("filled"); slot.style.opacity = "1";
        p.classList.add("used"); sfx.good();
        if (cells.every(c => c.classList.contains("filled"))) {
          setTimeout(() => win("jigsaw", "Puzzle done!"), 400);
        }
      };
      tray.appendChild(p);
    });
  }
});

// ============ 2. Dig-a-Dino (adapted from Kids Dinosaur Adventure dig mechanic) ============
register({
  id: "dig", name: "Dig a Dino", emoji: "⛏️",
  init(area) {
    const target = pick(DINOS);
    area.innerHTML = `
      <div class="message">Tap the soil to dig!</div>
      <div class="board" id="dig" style="grid-template-columns:repeat(4,64px);"></div>`;
    const b = $("#dig");
    let found = 0;
    const hidden = new Set([rnd(16), rnd(16), rnd(16)]);
    for (let i = 0; i < 16; i++) {
      const c = document.createElement("div");
      c.className = "slot"; c.textContent = "🟫";
      c.onclick = () => {
        if (c.dataset.done) return;
        c.dataset.done = 1;
        if (hidden.has(i)) {
          c.textContent = target; c.classList.add("filled");
          found++; sfx.good();
          if (found >= 3) setTimeout(() => win("dig", "You found the dino!"), 400);
        } else {
          c.textContent = pick([DINO.bone, DINO.egg, "🪨"]);
          sfx.tap();
        }
      };
      b.appendChild(c);
    }
  }
});

// ============ 3. Lotto — match dino to footprint (adapted from Orchard Dinosaur Lotto) ============
register({
  id: "lotto", name: "Dino Lotto", emoji: "🎯",
  init(area) {
    const set = shuffle(DINOS).slice(0, 4);
    area.innerHTML = `
      <div class="message">Match each dino to its footprint!</div>
      <div class="row" id="lotto" style="gap:14px;"></div>`;
    const row = $("#lotto");
    let done = 0;
    set.forEach(d => {
      const col = document.createElement("div");
      col.style.display = "flex"; col.style.flexDirection = "column"; col.style.gap = "10px";
      const foot = document.createElement("div");
      foot.className = "cell"; foot.style.width = "70px"; foot.style.height = "70px";
      foot.textContent = DINO.footprint;
      const opts = document.createElement("div");
      opts.style.display = "flex"; opts.style.gap = "6px";
      shuffle([d, ...shuffle(DINOS.filter(x => x !== d)).slice(0, 2)]).forEach(o => {
        const b = document.createElement("button");
        b.className = "dino-btn"; b.textContent = o;
        b.onclick = () => {
          if (o === d) {
            foot.textContent = d; foot.classList.add("right");
            b.classList.add("active");
            opts.querySelectorAll("button").forEach(x => x.disabled = true);
            done++; sfx.good();
            if (done === set.length) setTimeout(() => win("lotto", "All matched!"), 400);
          } else { b.classList.add("wrong"); sfx.bad(); setTimeout(() => b.classList.remove("wrong"), 350); }
        };
        opts.appendChild(b);
      });
      col.appendChild(foot); col.appendChild(opts);
      row.appendChild(col);
    });
  }
});

// ============ 4. Assemble — build the dino from body parts (adapted from Dinosaur Dig 3D) ============
register({
  id: "assemble", name: "Build a Dino", emoji: "🔧",
  init(area) {
    const parts = ["🦴", "🦴", "🦶", "🦶", "🦴", "🦕"];
    area.innerHTML = `
      <div class="message">Tap parts in order to build!</div>
      <div class="row" id="parts"></div>
      <div class="big-emoji" id="result">❓</div>`;
    const row = $("#parts");
    let idx = 0;
    shuffle(parts).forEach(p => {
      const b = document.createElement("button");
      b.className = "dino-btn"; b.textContent = p;
      b.onclick = () => {
        if (p === parts[idx]) {
          b.classList.add("active"); b.disabled = true;
          idx++; sfx.good();
          if (idx === parts.length) {
            $("#result").textContent = pick(DINOS);
            setTimeout(() => win("assemble", "Dino built!"), 400);
          }
        } else { b.classList.add("wrong"); sfx.bad(); setTimeout(() => b.classList.remove("wrong"), 350); }
      };
      row.appendChild(b);
    });
  }
});

// ============ 5. Memory — dino card pairs (adapted from Dino Adventure Park memory game) ============
register({
  id: "memory", name: "Dino Memory", emoji: "🃏",
  init(area) {
    const set = shuffle(DINOS).slice(0, 4);
    const cards = shuffle([...set, ...set]);
    area.innerHTML = `
      <div class="message">Find the matching pairs!</div>
      <div class="board" id="mem" style="grid-template-columns:repeat(4,64px);"></div>`;
    const b = $("#mem");
    let open = null, lock = false, matched = 0;
    cards.forEach(c => {
      const el = document.createElement("div");
      el.className = "slot"; el.textContent = "❓"; el.dataset.v = c;
      el.onclick = () => {
        if (lock || el === open || el.classList.contains("filled")) return;
        el.textContent = c; el.classList.add("picked"); sfx.tap();
        if (!open) { open = el; return; }
        lock = true;
        if (open.dataset.v === c) {
          open.classList.replace("picked", "filled");
          el.classList.replace("picked", "filled");
          matched++; sfx.good();
          lock = false;
          if (matched === set.length) setTimeout(() => win("memory", "All pairs found!"), 400);
        } else {
          sfx.bad();
          setTimeout(() => {
            open.textContent = "❓"; el.textContent = "❓";
            open.classList.remove("picked"); el.classList.remove("picked");
            open = null; lock = false;
          }, 700);
        }
        open = null;
      };
      b.appendChild(el);
    });
  }
});

// ============ 6. ABC / shape sorting (adapted from KidloLand Dino Preschool sorting) ============
register({
  id: "sort", name: "Dino Sorting", emoji: "🗂️",
  init(area) {
    const shapes = shuffle(SHAPES);
    area.innerHTML = `
      <div class="message">Put each shape in its box!</div>
      <div class="row" id="boxes" style="gap:10px;"></div>
      <div class="tray" id="sortTray"></div>`;
    const boxes = $("#boxes"), tray = $("#sortTray");
    let done = 0;
    shapes.forEach(s => {
      const bx = document.createElement("div");
      bx.className = "cell"; bx.style.width = "70px"; bx.style.height = "70px";
      bx.textContent = s; bx.dataset.v = s;
      bx.onclick = () => { if (tray.querySelector(".pc:not(.used)")) tray.querySelector(".pc:not(.used)").dataset.target = s; };
      boxes.appendChild(bx);
    });
    shuffle([...shapes, ...shapes, ...shuffle(SHAPES).slice(0, 2)]).forEach(s => {
      const p = document.createElement("div");
      p.className = "pc"; p.textContent = s;
      p.onclick = () => {
        const target = shapes[done];
        if (s === target) {
          p.classList.add("used"); sfx.good();
          boxes.children[done].classList.add("right");
          done++;
          if (done === shapes.length) setTimeout(() => win("sort", "Sorted!"), 400);
        } else { p.classList.add("wrong"); sfx.bad(); setTimeout(() => p.classList.remove("wrong"), 350); }
      };
      tray.appendChild(p);
    });
  }
});

// ============ 7. Counting — feed the dino N snacks (adapted from Dino Preschool Math) ============
register({
  id: "count", name: "Dino Counting", emoji: "🔢",
  init(area) {
    const n = 2 + rnd(4); // 2-5
    const snack = pick(FOODS);
    area.innerHTML = `
      <div class="big-emoji speaking">${pick(DINOS)}</div>
      <div class="message">Give the dino ${n} snacks!</div>
      <div class="progress"><div id="bar"></div></div>
      <div class="feed-row">
        <button class="basket" id="give">${snack}</button>
        <button class="basket" id="stop">✋</button>
      </div>`;
    let got = 0;
    $("#give").onclick = () => {
      got++;
      $("#bar").style.width = (got / n * 100) + "%";
      sfx.good();
      if (got === n) setTimeout(() => win("count", `${n} snacks! Yum!`), 400);
    };
    $("#stop").onclick = () => {
      if (got === n) win("count", `${n} snacks! Yum!`);
      else { sfx.bad(); got = 0; $("#bar").style.width = "0%"; }
    };
  }
});

// ============ 8. Join the dots — trace a dino footprint path (adapted from Kids Dinosaur Join the Dots) ============
register({
  id: "dots", name: "Dino Tracing", emoji: "✏️",
  init(area) {
    area.innerHTML = `
      <div class="message">Draw through the dots in order!</div>
      <canvas id="dots" width="320" height="260"></canvas>
      <div class="controls">
        <button class="toolbtn" id="clear">🧹 Clear</button>
      </div>`;
    const cv = $("#dots"), ctx = cv.getContext("2d");
    // simple footprint arc path
    const pts = [];
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      pts.push({ x: 40 + t * 240, y: 180 - Math.sin(t * Math.PI) * 100 });
    }
    function draw() {
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.strokeStyle = "#4f8fd6"; ctx.lineWidth = 4; ctx.setLineDash([6, 6]);
      ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke();
      ctx.setLineDash([]);
      pts.forEach((p, i) => {
        ctx.fillStyle = i <= next ? "#4a8f3c" : "#fff";
        ctx.strokeStyle = "#4f8fd6"; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(p.x, p.y, 12, 0, 7); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#333"; ctx.font = "bold 14px sans-serif"; ctx.textAlign = "center";
        ctx.fillText(i + 1, p.x, p.y + 5);
      });
    }
    let next = -1;
    draw();
    let drawing = false;
    const pos = e => {
      const r = cv.getBoundingClientRect();
      const t = e.touches ? e.touches[0] : e;
      return { x: (t.clientX - r.left) * cv.width / r.width, y: (t.clientY - r.top) * cv.height / r.height };
    };
    function move(e) {
      if (!drawing) return;
      const p = pos(e);
      ctx.strokeStyle = "#f2a541"; ctx.lineWidth = 8; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.stroke();
      pts.forEach((pt, i) => {
        if (i > next && Math.hypot(p.x - pt.x, p.y - pt.y) < 20) {
          next = i; sfx.good(); draw();
          if (next === pts.length - 1) setTimeout(() => win("dots", "Beautiful trace!"), 400);
        }
      });
    }
    cv.addEventListener("pointerdown", e => { drawing = true; move(e); });
    cv.addEventListener("pointermove", move);
    cv.addEventListener("pointerup", () => drawing = false);
    $("#clear").onclick = () => { next = -1; sfx.tap(); draw(); };
  }
});

// ============ 9. Coloring — pick a colour, paint dino sections (adapted from Dinosaur Coloring Games) ============
register({
  id: "color", name: "Dino Coloring", emoji: "🎨",
  init(area) {
    const dino = pick(DINOS);
    area.innerHTML = `
      <div class="message">Pick a colour, then tap a part!</div>
      <div class="row" id="colors" style="gap:8px;"></div>
      <svg id="paint" viewBox="0 0 200 160" style="width:100%;max-width:360px;background:#fff;border-radius:14px;">
        <circle cx="100" cy="70" r="45" class="part" fill="#eee" data-need="1"/>
        <rect x="70" y="100" width="60" height="40" rx="10" class="part" fill="#eee" data-need="1"/>
        <circle cx="85" cy="60" r="6" fill="#333"/>
        <circle cx="115" cy="60" r="6" fill="#333"/>
        <path d="M85 85 Q100 95 115 85" stroke="#333" stroke-width="3" fill="none"/>
        <text x="100" y="30" text-anchor="middle" font-size="20">${dino}</text>
      </svg>`;
    let color = "#e2604f";
    const row = $("#colors");
    Object.entries(COLORS).forEach(([name, hex]) => {
      const s = document.createElement("div");
      s.className = "swatch" + (name === "red" ? " on" : "");
      s.style.background = hex;
      s.onclick = () => {
        color = hex; sfx.tap();
        row.querySelectorAll(".swatch").forEach(x => x.classList.remove("on"));
        s.classList.add("on");
      };
      row.appendChild(s);
    });
    $$("#paint .part").forEach(p => {
      p.style.cursor = "pointer";
      p.onclick = () => {
        p.setAttribute("fill", color);
        p.setAttribute("data-need", "0");
        sfx.good();
        if ($$("#paint .part").every(x => x.dataset.need === "0"))
          setTimeout(() => win("color", "Beautiful dino!"), 400);
      };
    });
  }
});

// ============ 10. Feeding — match food to hungry dino (adapted from Dinosaur Games Kids feeding) ============
register({
  id: "feed", name: "Feed the Dino", emoji: "🍽️",
  init(area) {
    const dino = pick(DINOS);
    const wants = pick(FOODS);
    area.innerHTML = `
      <div class="big-emoji speaking" id="fedino">${dino}</div>
      <div class="message">It wants: ${wants}</div>
      <div class="feed-row" id="foods"></div>`;
    let served = 0;
    const row = $("#foods");
    shuffle([wants, ...shuffle(FOODS.filter(f => f !== wants)).slice(0, 2)]).forEach(f => {
      const b = document.createElement("button");
      b.className = "basket"; b.textContent = f;
      b.onclick = () => {
        if (f === wants) {
          b.classList.add("right"); b.disabled = true;
          served++; sfx.good();
          if (served === 1) {
            // next round: new want
            const nw = pick(FOODS);
            served = 0;
            $("#fedino").textContent = pick(DINOS);
            document.querySelector(".message").textContent = "It wants: " + nw;
            row.innerHTML = "";
            const w2 = nw;
            shuffle([w2, ...shuffle(FOODS.filter(x => x !== w2)).slice(0, 2)]).forEach(f2 => {
              const b2 = document.createElement("button");
              b2.className = "basket"; b2.textContent = f2;
              b2.onclick = () => {
                if (f2 === w2) { b2.classList.add("right"); b2.disabled = true; sfx.good();
                  setTimeout(() => win("feed", "The dino is happy!"), 400);
                } else { b2.classList.add("wrong"); sfx.bad(); setTimeout(() => b2.classList.remove("wrong"), 350); }
              };
              row.appendChild(b2);
            });
          }
        } else { b.classList.add("wrong"); sfx.bad(); setTimeout(() => b.classList.remove("wrong"), 350); }
      };
      row.appendChild(b);
    });
  }
});

// ---------- boot ----------
showMenu();