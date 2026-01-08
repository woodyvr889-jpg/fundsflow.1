 "use strict";

/* =====================================================
   FundsFlow v100 — One JS File (Login + Hub)
   - Login keypad + profiles
   - Hub welcome + logout
   - Points leaderboard (auto ranks)
   - Normal Shop open, Shop+ shown as closed
   - Admin unlock (codes only in JS)
   - Christmas theme with candy-cane support
   - Stranger Things, Stranger Game, Stranger Shop, Daily spin, etc. 
===================================================== */

alert("script.js is running");

/* ---------- CHRISTMAS THEME OVERRIDE ----------
   null        = auto by real date
   "xmas"      = Christmas season (red/green)
   "xmas_eve"  = Christmas Eve (night)
   "xmas_day"  = Christmas Day (bright)
------------------------------------------------ */
const THEME_OVERRIDE = null;

/* ---------- STORAGE ---------- */
const storage = (() => {
  try {
    if (localStorage) return localStorage;
  } catch (e) {}
  let mem = {};
  return {
    getItem: k => (k in mem ? mem[k] : null),
    setItem: (k, v) => (mem[k] = String(v)),
    removeItem: k => delete mem[k]
  };
})();

/* ---------- USERS ---------- */
const USERS = [
  { name: "James",          code: "080512" },
  { name: "Mum",            code: "2206"   },
  { name: "Dad",    
code: "2085"   },
  { name: "Nannan",         code: "4213"   },
  { name: "Grandad Darren", code: "8765"   },
  { name: "Grandma Jean",   code: "1357"   },
  { name: "Grandad Steve",  code: "2468"   },
  { name: "Uncle Paul",     code: "1122"   }
];

/* ---------- ADMIN CODES (ONLY HERE) ---------- */
const ADMIN_UNLOCK_CODES = ["7772", "1994029", "080512", "1112"];

/* ---------- KEYS ---------- */
const KEYS = {
  CURRENT_USER: "ff_current_user",
  USERS_DATA:   "ff_users_data",
  ADMIN_FLAG:   "ff_is_admin",
  SHOP_MODE:    "ff_shop_mode",   // "normal" or "plus"
  SHOP_STOCK:   "ff_shop_stock"   // for future Shop+
};

/* ---------- DOM HELPERS ---------- */
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function toast(icon, msg) {
  const box = $("#toastContainer");
  if (!box) return;
  box.innerHTML = "";
  const d = document.createElement("div");
  d.className = "toast";
  d.innerHTML = `<span>${icon}</span> ${msg}`;
  box.appendChild(d);
  requestAnimationFrame(() => d.classList.add("show"));
  setTimeout(() => {
    d.classList.remove("show");
    setTimeout(() => d.remove(), 250);
  }, 2500);
}

/* =====================================================
   THEMES (with CHRISTMAS)
===================================================== */

function getChristmasThemeForDate(d) {
  const day = d.getDate();

  // Manual override wins
  if (THEME_OVERRIDE === "xmas_eve") {
    return {
      bg: "radial-gradient(circle at top,#020617,#111827 60%)",
      accent: "#f97316",
      text: "#e5e7eb",
      candy: true,
      mode: "night"
    };
  }
  if (THEME_OVERRIDE === "xmas_day") {
    return {
      bg: "radial-gradient(circle at top,#fef9c3,#b91c1c 65%)",
      accent: "#16a34a",
      text: "#0f172a",
      candy: true,
      mode: "day"
    };
  }
  if (THEME_OVERRIDE === "xmas") {
    return {
      bg: "radial-gradient(circle at top,#fee2e2,#064e3b 60%)",
      accent: "#b91c1c",
      text: "#f9fafb",
      candy: true,
      mode: "season"
    };
  }

  // Auto December behaviour
  if (d.getMonth() === 11) { // December
    if (day === 24) {
      return {
        bg: "radial-gradient(circle at top,#020617,#111827 60%)",
        accent: "#f97316",
        text: "#e5e7eb",
        candy: true,
        mode: "night"
      };
    }
    if (day === 25) {
      return {
        bg: "radial-gradient(circle at top,#fef9c3,#b91c1c 65%)",
        accent: "#16a34a",
        text: "#0f172a",
        candy: true,
        mode: "day"
      };
    }
    // Rest of December = Christmas season
    return {
      bg: "radial-gradient(circle at top,#fee2e2,#064e3b 60%)",
      accent: "#b91c1c",
      text: "#f9fafb",
      candy: true,
      mode: "season"
    };
  }

  // Fallback (non-December)
  return {
    bg: "radial-gradient(circle at top,#4c1d95,#020617 55%)",
    accent: "#8b5cf6",
    text: "#e5e7eb",
    candy: false,
    mode: ""
  };
}

function applyTheme() {
  const root = document.documentElement;
  const body = document.body;
  if (!root || !body) return;

  const now = new Date();
  let theme = getChristmasThemeForDate(now);

  root.style.setProperty("--bg-main", theme.bg);
  root.style.setProperty("--accent", theme.accent);
  root.style.setProperty("--text-main", theme.text);

  // Candy-cane borders via CSS variables
  if (theme.candy) {
    root.style.setProperty(
      "--card-border",
      "repeating-linear-gradient(45deg,#f97373 0 10px,#ffffff 10px 20px)"
    );
    root.style.setProperty("--card-border-width", "3px");
  } else {
    root.style.removeProperty("--card-border");
    root.style.removeProperty("--card-border-width");
  }

  body.dataset.themeMode = theme.mode || "";
}

/* =====================================================
   USER DATA + PROFILE
===================================================== */

function initUsersData() {
  let data = JSON.parse(storage.getItem(KEYS.USERS_DATA) || "null");
  if (!data) {
    data = {};
    USERS.forEach(u => {
      data[u.name] = { displayName: u.name, email: "", phone: "", avatar: "" };
    });
    storage.setItem(KEYS.USERS_DATA, JSON.stringify(data));
  }
  return data;
}
function currentUserName() {
  return storage.getItem(KEYS.CURRENT_USER);
}

/* PROFILE AUTOSAVE */
function initProfileEditor() {
  const meName = currentUserName();
  if (!meName) return;

  const data = initUsersData();
  const prof = data[meName] || { displayName: meName, email: "", phone: "" };

  const nameEl  = $("#profileName");
  const emailEl = $("#profileEmail");
  const phoneEl = $("#profilePhone");

  if (nameEl)  nameEl.value  = prof.displayName || meName;
  if (emailEl) emailEl.value = prof.email || "";
  if (phoneEl) phoneEl.value = prof.phone || "";

  function save() {
    const all = initUsersData();
    const p = all[meName] || {};
    p.displayName = (nameEl?.value || meName).trim() || meName;
    p.email       = (emailEl?.value || "").trim();
    p.phone       = (phoneEl?.value || "").trim();
    all[meName] = p;
    storage.setItem(KEYS.USERS_DATA, JSON.stringify(all));

    const welcomeEl = $("#hubWelcomeName");
    if (welcomeEl) welcomeEl.textContent = p.displayName;
  }

  nameEl?.addEventListener("input", save);
  emailEl?.addEventListener("input", save);
  phoneEl?.addEventListener("input", save);
}

/* =====================================================
   ADMIN UNLOCK (HUB)
===================================================== */

function isAdmin() {
  return storage.getItem(KEYS.ADMIN_FLAG) === "1";
}

function initAdminUnlock() {
  const input  = $("#adminCodeInput");
  const btn    = $("#adminCodeBtn");
  const status = $("#adminStatus");
  const toolsSection = $("#sec-admintools"); // matches your hub.html

  if (!input || !btn) return;

  function applyState() {
    const unlocked = isAdmin();
    if (toolsSection) {
      toolsSection.classList.toggle("hidden", !unlocked);
    }
    if (status) {
      status.textContent = unlocked ? "Admin: unlocked" : "Admin: locked";
    }
  }

  applyState();

  btn.addEventListener("click", () => {
    const val = input.value.trim();
    if (ADMIN_UNLOCK_CODES.includes(val)) {
      storage.setItem(KEYS.ADMIN_FLAG, "1");
      toast("✅", "Admin unlocked");
      input.value = "";
      applyState();
    } else {
      toast("⚠️", "Wrong admin code");
    }
  });
}

/* =====================================================
   LOGIN PAGE
===================================================== */

function initLoginPage() {
  applyTheme();

  if (storage.getItem(KEYS.CURRENT_USER)) {
    location.replace("hub.html");
    return;
  }

  const grid         = $("#loginProfiles");
  const keypad       = $("#keypadSection");
  const profilesCard = $("#profilesCard");
  const display      = $("#keypadDisplay");
  const keypadTitle  = $("#keypadTitle");
  const error        = $("#loginError");
  const back         = $("#backToProfiles");

  if (!grid || !keypad || !profilesCard || !display) return;

  let selected = null;
  let entered  = "";

  grid.innerHTML = USERS.map(u => {
    const initials = u.name.split(" ").map(x => x[0]).join("").toUpperCase();
    return `
      <div class="user-card" data-user="${u.name}">
        <div class="user-avatar">${initials}</div>
        <div class="user-name">${u.name}</div>
        <div class="user-hint">Tap to login</div>
      </div>`;
  }).join("");

  $$(".user-card", grid).forEach(card => {
    card.addEventListener("click", () => {
      const uname = card.dataset.user;
      selected = USERS.find(u => u.name === uname) || null;
      if (!selected) return;
      entered = "";
      if (error) error.textContent = "";
      if (keypadTitle) keypadTitle.textContent = `Enter code for ${selected.name}`;
      display.textContent = "----";
      keypad.classList.remove("hidden");
      profilesCard.classList.add("hidden");
    });
  });

  function upd() {
    const stars = entered.replace(/./g, "●");
    const len = selected ? selected.code.length : 4;
    display.textContent = (stars + "----").slice(0, len);
  }

  $$(".key-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      if (!selected) return;
      const n   = btn.dataset.num;
      const act = btn.dataset.action;

      if (act === "clear") {
        entered = "";
        upd();
        return;
      }

      if (act === "enter") {
        if (entered === selected.code) {
          storage.setItem(KEYS.CURRENT_USER, selected.name);
          initUsersData();
          toast("✅", "Logged in");
          setTimeout(() => location.replace("hub.html"), 300);
        } else {
          if (error) error.textContent = "Wrong code";
          entered = "";
          upd();
          toast("⚠️", "Incorrect");
        }
        return;
      }

      if (n && entered.length < selected.code.length) {
        entered += n;
        upd();
      }
    });
  });

  back?.addEventListener("click", () => {
    keypad.classList.add("hidden");
    profilesCard.classList.remove("hidden");
  });
}

/* =====================================================
   NORMAL SHOP + SHOP+ STATE
===================================================== */

/* ----- NORMAL SHOP ITEMS ----- */
const NORMAL_SHOP_ITEMS = [
  // Buyable with points
  {
    id:"pts_bidding_voucher",
    emoji:"🎟️",
    name:"Bidding Voucher",
    desc:"Enter a special bidding round or get a small head start.",
    pricePoints:5000,
    priceMoney:null
  },
  {
    id:"pts_immunity",
    emoji:"🔒",
    name:"Immunity from Eviction",
    desc:"Protect yourself from being evicted in 1 round.",
    pricePoints:10000,
    priceMoney:null
  },
  {
    id:"pts_gift_1k",
    emoji:"💌",
    name:"Gift Points (1,000 pts)",
    desc:"Send 1,000 points to another player.",
    pricePoints:1000,
    priceMoney:null
  },
  {
    id:"pts_gift_5k",
    emoji:"💌",
    name:"Gift Points (5,000 pts)",
    desc:"Send 5,000 points to another player.",
    pricePoints:5000,
    priceMoney:null
  },
  {
    id:"pts_gift_10k",
    emoji:"💌",
    name:"Gift Points (10,000 pts)",
    desc:"Send 10,000 points to another player.",
    pricePoints:10000,
    priceMoney:null
  },
  {
    id:"pts_lucky_draw",
    emoji:"💫",
    name:"Lucky Draw Ticket",
    desc:"Grants access to the next Lucky Draw.",
    pricePoints:2000,
    priceMoney:null
  },
  {
    id:"pts_out_of_jail",
    emoji:"🕒",
    name:"Out-Of-Jail! (1 Round)",
    desc:"Skip one eviction/penalty in an event.",
    pricePoints:7000,
    priceMoney:null
  },
  {
    id:"pts_title",
    emoji:"🏅",
    name:"Exclusive Title (1 week)",
    desc:"Choose a fun custom title for 1 week.",
    pricePoints:2000,
    priceMoney:null
  },

  // Buyable with money
  {
    id:"money_immunity5",
    emoji:"🔒",
    name:"Immunity from Eviction (5 Rounds)",
    desc:"Prismatic immunity for 5 rounds.",
    pricePoints:null,
    priceMoney:10
  },
  {
    id:"money_10k",
    emoji:"💰",
    name:"Buy 10,000 Points",
    desc:"Instantly add 10,000 points.",
    pricePoints:null,
    priceMoney:2
  },
  {
    id:"money_box1",
    emoji:"🎁",
    name:"Mystery Box (Level 1)",
    desc:"Random reward (500–4,999 pts or rare item).",
    pricePoints:null,
    priceMoney:3
  },
  {
    id:"money_box2",
    emoji:"🎁",
    name:"Mystery Box (Level 2)",
    desc:"Random reward (5,000–19,999 pts or rare item).",
    pricePoints:null,
    priceMoney:5
  },
  {
    id:"money_box3",
    emoji:"🎁",
    name:"Mystery Box (Level 3)",
    desc:"Random reward (20,000–40,000 pts or rare item).",
    pricePoints:null,
    priceMoney:7
  },
  {
    id:"money_box_lux",
    emoji:"🎁",
    name:"Mystery Box (Luxury)",
    desc:"Random reward (50,000–100,000 pts or rare item).",
    pricePoints:null,
    priceMoney:10
  },
  {
    id:"money_25k",
    emoji:"💰",
    name:"Buy 25,000 Points",
    desc:"Big value points pack.",
    pricePoints:null,
    priceMoney:5
  },
  {
    id:"money_vouch_x3",
    emoji:"🧧",
    name:"Bidding Voucher Pack (x3)",
    desc:"Three vouchers. All expire Nov 1st 2026.",
    pricePoints:null,
    priceMoney:7.5
  },
  {
    id:"money_vouch_x5",
    emoji:"🧧",
    name:"Bidding Voucher Pack (x5)",
    desc:"Five vouchers. All expire Dec 1st 2026.",
    pricePoints:null,
    priceMoney:12
  },
  {
    id:"money_immunity2",
    emoji:"🛡️",
    name:"Immunity Pass (2 Events)",
    desc:"Immunity from eviction for 2 events.",
    pricePoints:null,
    priceMoney:8
  },
  {
    id:"money_vip_badge",
    emoji:"🎖️",
    name:"VIP Member Badge",
    desc:"Access to exclusive deals and events.",
    pricePoints:null,
    priceMoney:3
  },
  {
    id:"money_wheel",
    emoji:"🎲",
    name:"Lucky Wheel Spin",
    desc:"Spin the wheel for random prizes.",
    pricePoints:null,
    priceMoney:1
  }
];

/* Shop+ placeholder stock (kept for future) */
const SHOPPLUS_STOCK = {
  flash_10k:15,
  flash_50k:15,
  flash_100k:15,
  flash_250k:15,
  flash_500k:15,
  flash_1m:15,
  pts_voucher:15,
  pts_immunity1:15,
  pts_jail:15,
  pts_doublebid:15,
  pts_vip24:15,
  money_immunity5:15,
  money_immunity10:15,
  box_lvl1:15,
  box_lvl2:15,
  box_lvl3:15,
  box_lux:15,
  box_galaxy:15,
  bundle_mega:15,
  vouch_x3:15,
  vouch_x5:15,
  vouch_x10:15,
  fun_wheel:15,
  fun_draw:15,
  raffle_ticket:15
};

function renderNormalShop() {
  const wrap = $("#normalShopItems");
  if (!wrap) return;

  wrap.innerHTML = NORMAL_SHOP_ITEMS.map(item => {
    const price = item.pricePoints != null
      ? `${item.pricePoints.toLocaleString()} pts`
      : `£${item.priceMoney.toFixed(2)}`;
    return `
      <div class="shop-item">
        <div class="shop-top">
          <div class="shop-emoji">${item.emoji}</div>
          <div>
            <div class="shop-name">${item.name}</div>
            <div class="muted small">${price}</div>
          </div>
        </div>
        <div class="shop-desc">${item.desc}</div>
      </div>
    `;
  }).join("");
}

function markShopPlusClosed() {
  const limited = $("#limitedDeals");
  const all = $("#shopPlusItems");
  if (limited) limited.innerHTML = "";
  if (all) all.innerHTML = "";
}

/* =====================================================
   POINTS LEADERBOARD
===================================================== */

// Everyone ~500k, Uncle Paul slightly higher
const POINTS_DATA = [
  { name: "Uncle Paul",     points: 500 },
  { name: "Grandad Steve",  points: 0 },
  { name: "Mum",            points: 0 },
  { name: "Grandma Jean",   points: 0 },
  { name: "Nannan",         points: 0 },
  { name: "Grandad Darren", points: 0 },
  { name: "Dad",            points: 0 }
];

function renderPointsTable() {
  const tbody = $("#pointsTable tbody");
  if (!tbody) return;
  const sorted = [...POINTS_DATA].sort((a, b) => b.points - a.points);
  tbody.innerHTML = sorted.map((r, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${r.name}</td>
      <td>${r.points.toLocaleString()}</td>
    </tr>
  `).join("");
}

/* =====================================================
   HUB PAGE
===================================================== */

function initHubPage() {
  applyTheme();

  const me = currentUserName();
  if (!me) {
    location.replace("index.html");
    return;
  }

  const data = initUsersData();
  const prof = data[me] || { displayName: me };
  const welcomeEl = $("#hubWelcomeName");
  if (welcomeEl) welcomeEl.textContent = prof.displayName;

  // Logout
  const logoutBtn = $("#btnLogout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      storage.removeItem(KEYS.CURRENT_USER);
      toast("✅", "Logged out");
      setTimeout(() => location.replace("index.html"), 300);
    });
  }

  // Points + Shop
  renderPointsTable();
  renderNormalShop();
  markShopPlusClosed();

  // Profile + Admin
  initProfileEditor();
  initAdminUnlock();

  // Admin shop mode buttons
  const btnNorm = $("#btnAdminOpenNormal");
  const btnPlus = $("#btnAdminOpenPlus");
  const secShop = $("#sec-shop");
  const secShopPlus = $("#sec-shopplus");

  function setShopMode(mode) {
    // Normal mode: normal shop visible, Shop+ card visible but empty/closed
    if (!secShop || !secShopPlus) return;
    if (mode === "plus") {
      secShop.classList.add("hidden");
      secShopPlus.classList.remove("hidden");
      storage.setItem(KEYS.SHOP_MODE, "plus");
    } else {
      // default = normal
      secShop.classList.remove("hidden");
      secShopPlus.classList.remove("hidden"); // keep closed text visible
      storage.setItem(KEYS.SHOP_MODE, "normal");
    }
  }

  // Default from storage (or normal)
  setShopMode(storage.getItem(KEYS.SHOP_MODE) || "normal");

  if (btnNorm) {
    btnNorm.addEventListener("click", () => {
      if (!isAdmin()) {
        toast("⚠️", "Admin only");
        return;
      }
      setShopMode("normal");
      toast("✅", "Normal shop opened");
    });
  }
  if (btnPlus) {
    btnPlus.addEventListener("click", () => {
      if (!isAdmin()) {
        toast("⚠️", "Admin only");
        return;
      }
      setShopMode("plus");
      toast("✅", "Shop+ mode enabled");
    });
  }
}

/* =====================================================
   BOOTSTRAP
===================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.page;
  if (page === "login") initLoginPage();
  if (page === "hub")   initHubPage();
});

/* =========================================================
   STRANGER GAME SCRIPT
========================================================= */

/* NAVIGATION */
function goHub(){location.href="hub.html";}
function goUpside(){location.href="upsidedown.html";}
function goShop(){location.href="strangershop.html";}
function goSpin(){location.href="dailyspin.html";}
function goBoard(){location.href="leaderboard.html";}

/* DAILY PLAY LOCK */
const today = new Date().toDateString();
if(localStorage.getItem("played") === today){
  const startBtn = document.getElementById("startBtn");
  if(startBtn) startBtn.style.display="none";
  const lockMsg = document.getElementById("lockMsg");
  if(lockMsg) lockMsg.innerText =
    "Uh-oh! You've already played today. Come back tomorrow!";
}

/* GAME START */
function startGame(){
  localStorage.setItem("played", today);
  const topNav = document.getElementById("topNav");
  if(topNav) topNav.style.display="none";
  const startBtn = document.getElementById("startBtn");
  if(startBtn) startBtn.style.display="none";
  startTimer();
}

/* TIMER */
let seconds = 180;
function startTimer(){
  const t = setInterval(()=>{
    seconds--;
    const m = Math.floor(seconds/60);
    const s = seconds%60;
    const timeEl = document.getElementById("time");
    if(timeEl) timeEl.innerText =
      m + ":" + (s<10?"0":"") + s;
    if(seconds<=0) clearInterval(t);
  },1000);
}

/* PLAYER MOVEMENT */
const player = document.getElementById("player");
const walls = document.querySelectorAll(".wall");
const gameArea = document.getElementById("gameArea");

let px = 30, py = 30;
const speed = 6;

document.addEventListener("keydown", e=>{
  if(!player) return;
  let nx = px, ny = py;
  if(e.key==="ArrowUp"||e.key==="w") ny -= speed;
  if(e.key==="ArrowDown"||e.key==="s") ny += speed;
  if(e.key==="ArrowLeft"||e.key==="a") nx -= speed;
  if(e.key==="ArrowRight"||e.key==="d") nx += speed;

  if(!hitsWall(nx,ny)){
    px = nx; py = ny;
    player.style.left = px+"px";
    player.style.top = py+"px";
  }
});

function hitsWall(x,y){
  if(!walls || walls.length===0 || !gameArea) return false;
  const pr = {l:x,t:y,r:x+26,b:y+26};
  const gr = gameArea.getBoundingClientRect();
  for(const w of walls){
    const wr = w.getBoundingClientRect();
    const r = {
      l:wr.left-gr.left,
      t:wr.top-gr.top,
      r:wr.right-gr.left,
      b:wr.bottom-gr.top
    };
    if(pr.r>r.l && pr.l<r.r && pr.b>r.t && pr.t<r.b) return true;
  }
  return false;
}

/* GAMEPLAY: SCORE, TIMER, COLLECTIBLES */
const scoreDisplay = document.getElementById('score');
const timerDisplay = document.getElementById('timer');

const gameWidth = gameArea.clientWidth;
const gameHeight = gameArea.clientHeight;

let playerPos = { x: 180, y: 180 };
let score = 0;
let time = 60;
let collectibles = [];

// Create collectibles ⚡
for (let i = 0; i < 5; i++) {
  const c = document.createElement('div');
  c.textContent = '⚡';
  c.style.position = 'absolute';
  c.style.fontSize = '1.5rem';
  c.style.color = '#f5e050';
  c.style.left = Math.random() * (gameWidth - 30) + 'px';
  c.style.top = Math.random() * (gameHeight - 30) + 'px';
  gameArea.appendChild(c);
  collectibles.push(c);
}

// Movement & collision detection
document.addEventListener('keydown', (e) => {
  const step = 10;
  switch (e.key) {
    case 'ArrowUp': playerPos.y -= step; break;
    case 'ArrowDown': playerPos.y += step; break;
    case 'ArrowLeft': playerPos.x -= step; break;
    case 'ArrowRight': playerPos.x += step; break;
  }
  // Keep inside bounds
  playerPos.x = Math.max(0, Math.min(gameWidth - 40, playerPos.x));
  playerPos.y = Math.max(0, Math.min(gameHeight - 40, playerPos.y));
  player.style.left = playerPos.x + 'px';
  player.style.top = playerPos.y + 'px';

  collectibles.forEach((c, idx) => {
    const cx = c.offsetLeft;
    const cy = c.offsetTop;
    const distance = Math.hypot(playerPos.x - cx, playerPos.y - cy);
    if (distance < 30) {
      score++;
      scoreDisplay.textContent = 'Score: ' + score;
      c.remove();
      collectibles.splice(idx, 1);
      if (score === 5) winGame();
    }
  });
});

// Timer countdown
const timerInterval = setInterval(() => {
  time--;
  timerDisplay.textContent = 'Time: ' + time + 's';
  if (time <= 0) loseGame();
}, 1000);

// Win/Lose handlers
function winGame() {
  clearInterval(timerInterval);
  alert('🎉 YOU WON! Stranger Things style! 🎉');
  window.location.href = 'hub.html';
}
function loseGame() {
  clearInterval(timerInterval);
  alert('⏰ TIME\'S UP! Try again!');
  window.location.href = 'hub.html';
}

