"use strict";

// CookiesWeb: A small incremental game in vanilla JS
// Structure:
// - State & constants
// - Utility functions
// - Rendering (stats, shop, messages)
// - Game logic (clicking, buying, CPS, unlocks)
// - Persistence (save, load, autosave)
// - Achievements & prestige

// ===== State & constants =====
const STORAGE_KEY = "cookiesweb-save-v2";
const SETTINGS_KEY = "cookiesweb-settings-v1";
const AUTOSAVE_MS = 10000;
const TICK_MS = 100; // 10 ticks per second
const COST_MULTIPLIER = 1.15; // exponential scaling
const NOTIFICATION_DURATION_MS = 4000;

// New features
const AUTO_CLICK_UNLOCK = 1000; // Unlock auto-clicker at 1000 total cookies

// Upgrade catalog: id, name, baseCost, cps, unlockAt (cookies), description, icon
const UPGRADE_CATALOG = [
  { id: "cursor", name: "Cursor", baseCost: 15, cps: 0.1, unlockAt: 0, desc: "Autoclicks the big cookie." },
  { id: "grandma", name: "Grandma", baseCost: 80, cps: 1, unlockAt: 24, desc: "A nice grandma to bake more cookies." },
  { id: "farm", name: "Cookie Farm", baseCost: 880, cps: 8, unlockAt: 240, desc: "Grows cookie plants for maximum yield." },
  { id: "mine", name: "Cookie Mine", baseCost: 9600, cps: 47, unlockAt: 2000, desc: "Mines the choicest cookie dough."},
  { id: "factory", name: "Factory", baseCost: 130000, cps: 260, unlockAt: 25000, desc: "Automates cookie production." },
  { id: "bank", name: "Bank", baseCost: 1400000, cps: 1400, unlockAt: 200000, desc: "Generates cookies from interest." },
  { id: "temple", name: "Temple", baseCost: 20000000, cps: 7800, unlockAt: 1000000, desc: "Summons cookies from the beyond." },
  { id: "wizard", name: "Wizard Tower", baseCost: 330000000, cps: 44000, unlockAt: 10000000, desc: "Casts powerful cookie spells." },
  { id: "shipment", name: "Shipment", baseCost: 5100000000, cps: 260000, unlockAt: 100000000, desc: "Brings in fresh cookies from space." },
  { id: "alchemy", name: "Alchemy Lab", baseCost: 75000000000, cps: 1600000, unlockAt: 1000000000, desc: "Turns gold into cookies!" },
  { id: "portal", name: "Portal", baseCost: 1000000000000, cps: 10000000, unlockAt: 10000000000, desc: "Opens a door to the Cookieverse." },
  { id: "time", name: "Time Machine", baseCost: 14000000000000, cps: 65000000, unlockAt: 100000000000, desc: "Brings cookies from the past and future." },
];

// Cookie upgrades catalog: id, name, cost, unlockAt, effect, description, icon
const COOKIE_UPGRADES = [
  // Click upgrades
  { id: "reinforced_index", name: "Reinforced Index Finger", cost: 80, unlockAt: 40, effect: { type: "click", multiplier: 2 }, desc: "The mouse and cursors are twice as efficient." },
  { id: "carpal_tunnel", name: "Carpal Tunnel Prevention Cream", cost: 400, unlockAt: 200, effect: { type: "click", multiplier: 2 }, desc: "The mouse and cursors are twice as efficient." },
  { id: "ambidextrous", name: "Ambidextrous", cost: 8000, unlockAt: 3000, effect: { type: "click", multiplier: 2 }, desc: "The mouse and cursors are twice as efficient." },
  { id: "thousand_fingers", name: "Thousand Fingers", cost: 80000, unlockAt: 50000, effect: { type: "click", multiplier: 5 }, desc: "The mouse and cursors gain +0.1 cookies for each non-cursor object owned." },
  { id: "million_fingers", name: "Million Fingers", cost: 8000000, unlockAt: 4000000, effect: { type: "click", multiplier: 10 }, desc: "Clicks are 10 times more powerful!" },

  // Grandma upgrades
  { id: "forwards_from_grandma", name: "Forwards from Grandma", cost: 1000, unlockAt: 500, effect: { type: "building", building: "grandma", multiplier: 2 }, desc: "Grandmas are twice as efficient." },
  { id: "steel_plated_rolling_pins", name: "Steel-plated Rolling Pins", cost: 5000, unlockAt: 2500, effect: { type: "building", building: "grandma", multiplier: 2 }, desc: "Grandmas are twice as efficient." },
  { id: "lubricated_dentures", name: "Lubricated Dentures", cost: 50000, unlockAt: 25000, effect: { type: "building", building: "grandma", multiplier: 2 }, desc: "Grandmas are twice as efficient." },
  { id: "prune_juice", name: "Prune Juice", cost: 500000, unlockAt: 250000, effect: { type: "building", building: "grandma", multiplier: 2 }, desc: "Grandmas are twice as efficient." },

  // Farm upgrades
  { id: "cheap_hoes", name: "Cheap Hoes", cost: 11000, unlockAt: 5500, effect: { type: "building", building: "farm", multiplier: 2 }, desc: "Farms are twice as efficient." },
  { id: "fertilizer", name: "Fertilizer", cost: 55000, unlockAt: 27500, effect: { type: "building", building: "farm", multiplier: 2 }, desc: "Farms are twice as efficient." },
  { id: "cookie_seeds", name: "Cookie Seeds", cost: 550000, unlockAt: 275000, effect: { type: "building", building: "farm", multiplier: 2 }, desc: "Farms are twice as efficient." },
  { id: "gmo_cookies", name: "GMO Cookies", cost: 5500000, unlockAt: 2750000, effect: { type: "building", building: "farm", multiplier: 2 }, desc: "Farms are twice as efficient." },

  // Mine upgrades
  { id: "sugar_gas", name: "Sugar Gas", cost: 120000, unlockAt: 60000, effect: { type: "building", building: "mine", multiplier: 2 }, desc: "Mines are twice as efficient." },
  { id: "megadrill", name: "Megadrill", cost: 600000, unlockAt: 300000, effect: { type: "building", building: "mine", multiplier: 2 }, desc: "Mines are twice as efficient." },
  { id: "ultradrill", name: "Ultradrill", cost: 6000000, unlockAt: 3000000, effect: { type: "building", building: "mine", multiplier: 2 }, desc: "Mines are twice as efficient." },

  // Factory upgrades
  { id: "sturdier_conveyor", name: "Sturdier Conveyor Belts", cost: 1300000, unlockAt: 650000, effect: { type: "building", building: "factory", multiplier: 2 }, desc: "Factories are twice as efficient." },
  { id: "child_labor", name: "Child Labor", cost: 6500000, unlockAt: 3250000, effect: { type: "building", building: "factory", multiplier: 2 }, desc: "Factories are twice as efficient." },
  { id: "sweatshop", name: "Sweatshop", cost: 65000000, unlockAt: 32500000, effect: { type: "building", building: "factory", multiplier: 2 }, desc: "Factories are twice as efficient." },

  // Bank upgrades
  { id: "taller_tellers", name: "Taller Tellers", cost: 14000000, unlockAt: 7000000, effect: { type: "building", building: "bank", multiplier: 2 }, desc: "Banks are twice as efficient." },
  { id: "scissor_resistant_credit_cards", name: "Scissor-resistant Credit Cards", cost: 70000000, unlockAt: 35000000, effect: { type: "building", building: "bank", multiplier: 2 }, desc: "Banks are twice as efficient." },

  // Global upgrades
  { id: "lucky_day", name: "Lucky Day", cost: 77777, unlockAt: 77777, effect: { type: "global", multiplier: 1.5 }, desc: "Everything is 50% more efficient! Your lucky day." },
  { id: "serendipity", name: "Serendipity", cost: 777777, unlockAt: 777777, effect: { type: "global", multiplier: 1.5 }, desc: "Everything is 50% more efficient! What a coincidence." },
  { id: "get_lucky", name: "Get Lucky", cost: 7777777, unlockAt: 7777777, effect: { type: "global", multiplier: 2 }, desc: "All production doubled! You've gotten lucky." },
];

// Achievements milestones (expanded)
const ACHIEVEMENTS = [
  { id: "first10", condition: s => s.totalCookies >= 10, text: "First 10 cookies baked!" },
  { id: "first100", condition: s => s.totalCookies >= 100, text: "100 cookies baked!" },
  { id: "first1k", condition: s => s.totalCookies >= 1000, text: "1,000 cookies baked!" },
  { id: "first10k", condition: s => s.totalCookies >= 10000, text: "10,000 cookies baked!" },
  { id: "first100k", condition: s => s.totalCookies >= 100000, text: "100,000 cookies baked!" },
  { id: "first1m", condition: s => s.totalCookies >= 1000000, text: "1 MILLION cookies baked!" },
  { id: "first1b", condition: s => s.totalCookies >= 1000000000, text: "1 BILLION cookies baked!" },
  { id: "firstGrandma", condition: s => (s.upgrades.grandma || 0) > 0, text: "First Grandma hired!" },
  { id: "firstFactory", condition: s => (s.upgrades.factory || 0) > 0, text: "First Factory built!" },
  { id: "firstPortal", condition: s => (s.upgrades.portal || 0) > 0, text: "First Portal opened!" },
  { id: "firstTime", condition: s => (s.upgrades.time || 0) > 0, text: "Time Machine acquired!" },
  { id: "idle", condition: s => s.totalCookies >= 100 && s.totalClicks === 0, text: "True idler: 100 cookies without clicking!" },
  { id: "clicker", condition: s => s.totalClicks >= 1000, text: "1,000 clicks! Dedication!" },
  { id: "speedClicker", condition: s => s.totalClicks >= 100 && s.totalCookies / Math.max(s.totalClicks, 1) < 2, text: "Speed clicker: mostly manual!" },
  { id: "bigSpender", condition: s => Object.values(s.upgrades).reduce((a,b) => a+b, 0) >= 100, text: "100 total upgrades bought!" },
  { id: "prestige1", condition: s => s.prestigePoints >= 1, text: "First prestige! The journey begins." },
  { id: "prestige10", condition: s => s.prestigePoints >= 10, text: "10 prestige points! Veteran baker." },
  { id: "level5", condition: s => s.level >= 5, text: "Level 5 reached! You're getting good at this." },
  { id: "level10", condition: s => s.level >= 10, text: "Level 10 reached! Experienced baker!" },
  { id: "level25", condition: s => s.level >= 25, text: "Level 25 reached! Master baker!" },
  { id: "level50", condition: s => s.level >= 50, text: "Level 50 reached! Cookie legend!" },
  { id: "upgrader", condition: s => Object.keys(s.cookieUpgrades).filter(k => s.cookieUpgrades[k]).length >= 5, text: "5 cookie upgrades purchased!" },
  { id: "collector", condition: s => Object.keys(s.cookieUpgrades).filter(k => s.cookieUpgrades[k]).length >= 15, text: "15 cookie upgrades purchased! Collector!" },
];

// Game state (saved)
let state = {
  cookies: 0,
  totalCookies: 0,
  totalClicks: 0,
  clickPower: 1,
  cps: 0,
  level: 1,
  experience: 0,
  experienceToNext: 100,
  prestigePoints: 0,
  prestigeMultiplier: 1,
  startTime: Date.now(),
  buildings: {},
  upgrades: {},
  // New features
  // combo system removed
  autoClickEnabled: false,
  autoBuyEnabled: false,
  clicksThisSecond: 0,
  clickRateHistory: []
};

const settings = {
  autosave: true,
  sound: true,
  haptics: true,
};

// Flavor text that changes based on progress
const FLAVOR_TEXTS = [
  "Click the big cookie!",
  "Look at all those cookies!",
  "So many cookies...",
  "Can you bake a million cookies?",
  "Clicking like crazy!",
  "Cookie empire rising!",
  "The sweet taste of success!",
  "Billions and billions served!",
  "You have achieved cookieness!",
  "All hail the cookie overlord!"
];

function updateFlavorText() {
  const total = state.totalCookies;
  let textIndex = 0;
  if (total >= 100) textIndex = 1;
  if (total >= 1000) textIndex = 2;
  if (total >= 10000) textIndex = 3;
  if (total >= 100000) textIndex = 4;
  if (total >= 1000000) textIndex = 5;
  if (total >= 10000000) textIndex = 6;
  if (total >= 100000000) textIndex = 7;
  if (total >= 1000000000) textIndex = 8;
  if (total >= 10000000000) textIndex = 9;

  $("#flavorText").textContent = FLAVOR_TEXTS[textIndex];
}

let autosaveInterval = null;
let currentTab = 'buildings';

// ===== Utils =====
const $ = sel => document.querySelector(sel);
const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};
const format = (num) => {
  if (!isFinite(num)) return "∞";
  if (num < 1000) return num.toFixed(num < 10 ? 2 : 0);
  const units = ["K","M","B","T","Q"]; // simple formatter
  let u = -1;
  while (num >= 1000 && u < units.length - 1) { num /= 1000; u++; }
  return `${num.toFixed(2)}${units[u]}`;
};
const currentMultiplier = () => state.prestigeMultiplier * getGlobalMultiplier() * getLevelMultiplier();
const scaledCost = (base, owned) => Math.ceil(base * Math.pow(COST_MULTIPLIER, owned));

// Calculate click power with upgrades
function getClickPower() {
  let power = 1;
  for (const upgrade of COOKIE_UPGRADES) {
    if (state.cookieUpgrades[upgrade.id] && upgrade.effect.type === 'click') {
      power *= upgrade.effect.multiplier;
    }
  }
  // Add a small click power bonus per prestige point: 0.5% per point
  const prestigeClickBonus = 1 + state.prestigePoints * 0.005;
  return power * currentMultiplier() * prestigeClickBonus;
}

// Calculate building multiplier
function getBuildingMultiplier(buildingId) {
  let multiplier = 1;
  for (const upgrade of COOKIE_UPGRADES) {
    if (state.cookieUpgrades[upgrade.id] &&
        upgrade.effect.type === 'building' &&
        upgrade.effect.building === buildingId) {
      multiplier *= upgrade.effect.multiplier;
    }
  }
  return multiplier;
}

// Calculate global multiplier from upgrades
function getGlobalMultiplier() {
  let multiplier = 1;
  for (const upgrade of COOKIE_UPGRADES) {
    if (state.cookieUpgrades[upgrade.id] && upgrade.effect.type === 'global') {
      multiplier *= upgrade.effect.multiplier;
    }
  }
  return multiplier;
}

// Audio system
const audioCtx = new (window.AudioContext || window.webkitAudioContext || (() => ({ createOscillator: () => ({}), createGain: () => ({}) })))();
function playSound(freq = 800, duration = 100, type = 'square') {
  if (!settings.sound || !audioCtx.createOscillator) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.value = freq;
    osc.type = type;
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration / 1000);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + duration / 1000);
  } catch (e) { /* ignore audio errors */ }
}

// Haptic feedback
function hapticFeedback(type = 'light') {
  if (!settings.haptics || !navigator.vibrate) return;
  try {
    const patterns = { light: [10], medium: [20], heavy: [30] };
    navigator.vibrate(patterns[type] || patterns.light);
  } catch (e) { /* ignore haptic errors */ }
}

// Notification system (disabled - no more notifications)
function showNotification(text, tone = "info", duration = NOTIFICATION_DURATION_MS) {
  // Notifications disabled - do nothing
}// Floating +N animation
function spawnFloat(text, x, y) {
  const layer = $("#floatLayer");
  const n = el("div", "float", text);
  const rect = layer.getBoundingClientRect();
  n.style.left = `${x - rect.left - 10}px`;
  n.style.top = `${y - rect.top - 10}px`;
  layer.appendChild(n);
  setTimeout(() => n.remove(), 900);
}

// ===== Rendering =====
function renderStats() {
  $("#cookieCount").textContent = format(state.cookies);
  $("#cps").textContent = format(totalCps());
  $("#prestigePoints").textContent = state.prestigePoints.toString();
  $("#prestigeMultiplier").textContent = `x${state.prestigeMultiplier.toFixed(2)}`;
  $("#clickPower").textContent = `+${format(getClickPower())}`;

  // Update level display
  $("#level").textContent = state.level.toString();
  $("#experience").textContent = Math.floor(state.experience).toString();
  $("#experienceToNext").textContent = state.experienceToNext.toString();

  // Update prestige button
  updatePrestigeButton();

  // Update flavor text
  updateFlavorText();

  // Update stats modal if open
  $("#totalCookiesStat").textContent = format(state.totalCookies);
  $("#totalClicksStat").textContent = format(state.totalClicks);
  $("#buildingsOwnedStat").textContent = Object.values(state.upgrades).reduce((a,b) => a+b, 0);
  const timePlayed = Math.floor((Date.now() - state.startTime) / 1000);
  $("#timePlayedStat").textContent = formatTime(timePlayed);
}

function formatTime(seconds) {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds/60)}m ${seconds%60}s`;
  if (seconds < 86400) return `${Math.floor(seconds/3600)}h ${Math.floor((seconds%3600)/60)}m`;
  return `${Math.floor(seconds/86400)}d ${Math.floor((seconds%86400)/3600)}h`;
}

function renderRecentAchievements() {
  // Recent achievements disabled - do nothing
}

function renderShop() {
  const list = $("#shopList");
  list.innerHTML = "";
  for (const u of UPGRADE_CATALOG) {
    const owned = state.upgrades[u.id] || 0;
    const cost = scaledCost(u.baseCost, owned);
    const unlocked = state.totalCookies >= u.unlockAt;
    const item = el("div", "shop-item" + (unlocked ? "" : " locked"));

    // Icon
    const icon = el("div", "icon", u.icon);

    // Meta info
    const meta = el("div", "meta");
    const name = el("div", "name", u.name);
    const desc = el("div", "desc", u.desc);
    const cpsEl = el("div", "desc", `+${format(u.cps * getBuildingMultiplier(u.id) * currentMultiplier())} CPS each`);
    const ownedEl = el("div", "owned", `Owned: ${owned}`);
    const costEl = el("div", "cost", `${format(cost)} cookies`);
    meta.append(name, desc, cpsEl, ownedEl, costEl);

    // Actions
    const actions = el("div", "actions");
    const buy = el("button", "buy", "Buy");
    buy.disabled = !unlocked || state.cookies < cost;
    buy.addEventListener("click", () => buyUpgrade(u.id));
    actions.appendChild(buy);

    // tag with id so updates can find this item even if order changes
    item.dataset.id = u.id;
    // make shop items keyboard accessible
    item.setAttribute('tabindex', '0');
    item.setAttribute('role', 'listitem');
    item.setAttribute('aria-label', `${u.name}, cost ${format(scaledCost(u.baseCost, owned))} cookies`);
    // Keyboard: Enter / Space to activate the Buy button
    item.addEventListener('keydown', (e) => {
      if (e.code === 'Enter' || e.code === 'Space') {
        const btn = item.querySelector('button.buy');
        if (btn && !btn.disabled) { e.preventDefault(); btn.click(); }
      }
    });
    item.append(icon, meta, actions);
    list.appendChild(item);
  }
}

// Throttle helper (runs fn at most every `ms` ms)
function throttle(fn, ms) {
  let last = 0;
  let scheduled = null;
  return function(...args) {
    const now = Date.now();
    const remaining = ms - (now - last);
    if (remaining <= 0) {
      if (scheduled) { clearTimeout(scheduled); scheduled = null; }
      last = now;
      fn.apply(this, args);
    } else if (!scheduled) {
      scheduled = setTimeout(() => {
        last = Date.now();
        scheduled = null;
        fn.apply(this, args);
      }, remaining);
    }
  };
}

// Create a throttled version of updateShopButtons to avoid running it every tick
const throttledUpdateShopButtons = throttle(updateShopButtons, 100);

function renderCookieUpgrades() {
  const list = $("#upgradesList");
  list.innerHTML = "";
  // Sort cookie upgrades by cookies required (unlockAt) ascending
  const sorted = COOKIE_UPGRADES.slice().sort((a, b) => (a.unlockAt || 0) - (b.unlockAt || 0));

  for (const upgrade of sorted) {
    const purchased = !!state.cookieUpgrades[upgrade.id];

  const item = el("div", "shop-item" + (purchased ? " purchased" : ""));
  item.dataset.id = upgrade.id;
  item.setAttribute('tabindex', '0');
  item.setAttribute('role', 'listitem');
  item.setAttribute('aria-label', `${upgrade.name} - ${upgrade.desc}`);

    // Icon
    const icon = el("div", "icon", upgrade.icon);

    // Meta info
    const meta = el("div", "meta");
    const name = el("div", "name", upgrade.name);
    // Inferred prestige level: 1 prestige per 1,000,000 lifetime cookies
  const requiredPrestige = Math.floor((upgrade.unlockAt || 0) / 1_000_000);
  const prestigeLabel = el("div", "prestige-req", `Prestige: ${requiredPrestige}`);
    const desc = el("div", "desc", upgrade.desc);
    const costEl = el("div", "cost", purchased ? "PURCHASED" : `${format(upgrade.cost)} cookies`);
    meta.append(name, prestigeLabel, desc, costEl);

    // Actions
    const actions = el("div", "actions");
    if (!purchased) {
      const buy = el("button", "buy", "Buy");
      buy.setAttribute('aria-label', `Buy ${upgrade.name} for ${format(upgrade.cost)} cookies`);
      const lacksPrestige = state.prestigePoints < requiredPrestige;
      buy.disabled = state.cookies < upgrade.cost || lacksPrestige;
      if (lacksPrestige) buy.title = `Requires prestige ${requiredPrestige} (1 point per 1,000,000 lifetime cookies)`;
      else buy.title = `Buy ${upgrade.name}`;
      buy.addEventListener("click", () => buyCookieUpgrade(upgrade.id));
      // Keyboard support: Enter or Space triggers buy
      buy.addEventListener('keydown', (e) => {
        if (e.code === 'Enter' || e.code === 'Space') { e.preventDefault(); buy.click(); }
      });
      actions.appendChild(buy);
      // prestige badge removed (kept only the prestige label)
    } else {
      const ownedLabel = el("div", "owned", "✓ Owned");
      actions.appendChild(ownedLabel);
    }

    item.append(icon, meta, actions);
    list.appendChild(item);
  }
  // If no upgrades to show, show coming soon message
  if (list.children.length === 0) {
    const comingSoon = el("div", "coming-soon", "More upgrades will unlock as you progress...");
    list.appendChild(comingSoon);
  }
}

// Tab switching
function switchTab(tabName) {
  currentTab = tabName;

  // Update tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });

  // Update tab content
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.toggle('active', content.id === `${tabName}-tab`);
  });

  // Render content for the active tab
  if (tabName === 'upgrades') {
    renderCookieUpgrades();
  }
}

function updateShopButtons() {
  // Update enabling/disabling buy buttons based on current cookies
  // Update building shop items (UPGRADE_CATALOG) by data-id mapping
  document.querySelectorAll('#shopList .shop-item').forEach(item => {
    const id = item.dataset.id;
    if (!id) return; // skip if we can't identify
    const u = UPGRADE_CATALOG.find(x => x.id === id);
    if (!u) return; // unknown id
    const owned = state.upgrades[u.id] || 0;
    const cost = scaledCost(u.baseCost, owned);
    const unlocked = state.totalCookies >= u.unlockAt;
    item.classList.toggle("locked", !unlocked);
    const btn = item.querySelector("button.buy");
    if (btn) btn.disabled = !unlocked || state.cookies < cost;
    // update meta
    const meta = item.querySelector(".meta");
    if (meta) {
      const ownedEl = meta.querySelector(".owned");
      if (ownedEl) ownedEl.textContent = `Owned: ${owned}`;
      const costEl = meta.querySelector(".cost");
      if (costEl) costEl.textContent = `${format(cost)} cookies`;
      const descs = meta.querySelectorAll(".desc");
      if (descs[1]) descs[1].textContent = `+${format(u.cps * getBuildingMultiplier(u.id) * currentMultiplier())} CPS each`;
    }
  });

  // Update cookie upgrades (the ones in the upgrades list). These are not indexed to UPGRADE_CATALOG.
  document.querySelectorAll('#upgradesList .shop-item').forEach(item => {
    const id = item.dataset.id;
    if (!id) return;
    const upgrade = COOKIE_UPGRADES.find(u => u.id === id);
    if (!upgrade) return;
    const purchased = state.cookieUpgrades[id] || false;
    const costEl = item.querySelector('.cost');
    if (costEl) costEl.textContent = purchased ? 'PURCHASED' : `${format(upgrade.cost)} cookies`;
    const buyBtn = item.querySelector('button.buy');
    if (buyBtn) {
      const requiredPrestige = Math.floor((upgrade.unlockAt || 0) / 1_000_000);
      const lacksPrestige = state.prestigePoints < requiredPrestige;
      buyBtn.disabled = state.cookies < upgrade.cost || purchased || lacksPrestige;
      if (lacksPrestige) buyBtn.title = `Requires prestige ${requiredPrestige}`;
      else buyBtn.title = '';
    }
    const ownedLabel = item.querySelector('.owned');
    if (ownedLabel) ownedLabel.textContent = purchased ? '✓ Owned' : '';
  });
}

// ===== Core logic =====
function totalCps() {
  let cps = 0;
  for (const u of UPGRADE_CATALOG) {
    const owned = state.upgrades[u.id] || 0;
    const buildingMultiplier = getBuildingMultiplier(u.id);
    cps += owned * u.cps * buildingMultiplier;
  }
  return cps * currentMultiplier();
}

// Auto-buy helper: prioritize cookie upgrades, then buildings; buy the cheapest affordable item
function autoBuyAttempt() {
  if (!state.autoBuyEnabled) return;
  // 1) cookie upgrades
  const affordableUpgrades = COOKIE_UPGRADES.filter(u => !state.cookieUpgrades[u.id] && state.cookies >= u.cost && state.prestigePoints >= Math.floor((u.unlockAt||0)/1_000_000));
  if (affordableUpgrades.length > 0) {
    affordableUpgrades.sort((a,b) => a.cost - b.cost);
    buyCookieUpgrade(affordableUpgrades[0].id);
    return;
  }
  // 2) buildings (choose cheapest next building across catalog)
  const buildingOptions = UPGRADE_CATALOG.map(u => {
    const owned = state.upgrades[u.id] || 0;
    return { id: u.id, cost: scaledCost(u.baseCost, owned), unlockAt: u.unlockAt };
  }).filter(b => state.totalCookies >= b.unlockAt && state.cookies >= b.cost);
  if (buildingOptions.length > 0) {
    buildingOptions.sort((a,b) => a.cost - b.cost);
    buyUpgrade(buildingOptions[0].id);
  }
}

function addCookies(amount) {
  state.cookies += amount;
  state.totalCookies += amount;
}

function onCookieClick(ev) {
  const now = Date.now();

  // Calculate click power (combo system removed)
  const baseGain = getClickPower();
  const gain = Math.floor(baseGain);

  addCookies(gain);
  state.totalClicks++;
  state.clicksThisSecond++;

  // Gain experience for clicking (1 XP per click)
  gainExperience(1);

  renderStats();
  throttledUpdateShopButtons();
  checkAutoClickUnlock();

  // Effects
  playSound(800 + Math.random() * 200, 50);
  hapticFeedback('light');

  // Create floating text showing gain
  if (ev && ev.clientX) {
    createFloatingText(`+${formatNumber(gain)}`, ev.clientX, ev.clientY);
  }
}

function buyUpgrade(id) {
  const def = UPGRADE_CATALOG.find(u => u.id === id);
  if (!def) return;
  const owned = state.upgrades[id] || 0;
  const cost = scaledCost(def.baseCost, owned);
  if (state.cookies < cost) {
    return;
  }
  state.cookies -= cost;
  state.upgrades[id] = owned + 1;
  playSound(600, 80);
  hapticFeedback('medium');
  renderStats();
  updateShopButtons();
}

function buyCookieUpgrade(id) {
  const upgrade = COOKIE_UPGRADES.find(u => u.id === id);
  if (!upgrade) return;
  if (state.cookieUpgrades[id]) return; // Already purchased
  if (state.cookies < upgrade.cost) return;

  state.cookies -= upgrade.cost;
  state.cookieUpgrades[id] = true;

  playSound(700, 100);
  hapticFeedback('medium');

  renderStats();
  renderCookieUpgrades();
  updateShopButtons();
}

// Unlock announcements
let announced = new Set();
function checkUnlocks() {
  for (const u of UPGRADE_CATALOG) {
    if (state.totalCookies >= u.unlockAt && !announced.has(u.id)) {
      playSound(1000, 200, 'sine');
      announced.add(u.id);
    }
  }
}

// Achievements
function checkAchievements() {
  for (const a of ACHIEVEMENTS) {
    if (!state.achievements[a.id] && a.condition(state)) {
      state.achievements[a.id] = true;
      playSound(1200, 300, 'sine');
      hapticFeedback('heavy');
    }
  }
}

// Leveling system
function gainExperience(amount) {
  state.experience += amount;
  checkLevelUp();
}

function checkLevelUp() {
  while (state.experience >= state.experienceToNext) {
    state.experience -= state.experienceToNext;
    state.level++;
    state.experienceToNext = Math.floor(100 * Math.pow(1.2, state.level - 1));

    // Show level up notification (visual feedback)
    playSound(1200, 300, 'triangle');
    hapticFeedback('medium');

    // Level up bonus: 5% increase to all production for each level
    renderStats();
  }
}

function getLevelMultiplier() {
  return 1 + (state.level - 1) * 0.05; // 5% per level
}

// Prestige
function canPrestige() {
  // Simple rule: 1 prestige point per 1e6 lifetime cookies (rounded down)
  const points = Math.floor(state.totalCookies / 1_000_000);
  return points > state.prestigePoints;
}
function nextPrestigePoints() {
  return Math.floor(state.totalCookies / 1_000_000);
}
function recalcPrestigeMultiplier() {
  // 10% per point, diminishing after 50
  const p = state.prestigePoints;
  // 10% per point for first 50, then 7.5% per point after
  const base = 1 + Math.min(p, 50) * 0.10 + Math.max(0, p - 50) * 0.075;
  state.prestigeMultiplier = base;

  // Apply prestige ladder milestones if present
  if (!state.prestigeMilestones) state.prestigeMilestones = {};
  const milestones = [5,10,25,50];
  for (const m of milestones) {
    if (p >= m && !state.prestigeMilestones[m]) {
      // Grant milestone reward: small global multiplier stacking
      state.prestigeMilestones[m] = true;
      // reward: permanent global multiplier, tracked via achievements or extra multiplier
      // we'll emulate by adding a small permanent multiplier stored in state
      state.prestigeBonus = (state.prestigeBonus || 0) + (m === 5 ? 0.05 : m === 10 ? 0.1 : m ===25 ? 0.25 : 0.5);
    }
  }
}
function updatePrestigeButton() {
  const btn = $("#prestigeBtn");
  const gainSpan = $("#prestigeGain");
  const next = nextPrestigePoints();
  const gain = next - state.prestigePoints;
  btn.disabled = gain <= 0;
  gainSpan.textContent = gain > 0 ? `+${gain}` : "0";
}
function performPrestige() {
  const next = nextPrestigePoints();
  const gain = next - state.prestigePoints;
  const needed = 1_000_000 - (state.totalCookies % 1_000_000);

  if (gain <= 0) {
    const progress = state.totalCookies % 1_000_000;
    const pct = ((progress / 1_000_000) * 100).toFixed(2);
    alert(`Prestige Requirements:

• Need 1,000,000 total lifetime cookies for each prestige point
• You have: ${format(state.totalCookies)} lifetime cookies
• Current prestige points: ${state.prestigePoints}
• Progress to next prestige point: ${format(progress)}/1,000,000 (${pct}%)
• Cookies needed: ${format(needed)}

Prestige gives you +10% CPS permanently per point (first 50 points), then +5% per point after that.`);
    return;
  }

  if (!confirm(`Prestige for +${gain} prestige points? This will reset your progress but increase your permanent multiplier.

Current multiplier: x${state.prestigeMultiplier.toFixed(2)}
New multiplier: x${(1 + Math.min(next, 50) * 0.1 + Math.max(0, next - 50) * 0.05).toFixed(2)}

Are you sure you want to prestige?`)) return;

  state.prestigePoints = next;
  recalcPrestigeMultiplier();
  // reset progress but keep prestige
  state.cookies = 0;
  state.upgrades = {};
  state.totalClicks = 0;
  announced = new Set();
  playSound(1500, 500, 'sine');
  hapticFeedback('heavy');
  renderStats();
  renderShop();
  renderCookieUpgrades();
}// ===== Persistence & Settings =====
function saveSettings() {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) { console.error(e); }
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) Object.assign(settings, JSON.parse(raw));
  } catch (e) { console.error(e); }
}

function updateAutosaveStatus() {
  if (settings.autosave) {
    if (!autosaveInterval) {
      autosaveInterval = setInterval(() => {
        if (settings.autosave) {
          save(true); // true = silent save
          state.lastSave = Date.now();
        }
      }, AUTOSAVE_MS);
    }
  } else {
    if (autosaveInterval) {
      clearInterval(autosaveInterval);
      autosaveInterval = null;
    }
  }
}
function save(silent = false) {
  const payload = {
    cookies: state.cookies,
    totalCookies: state.totalCookies,
    totalClicks: state.totalClicks,
    upgrades: state.upgrades,
    cookieUpgrades: state.cookieUpgrades,
    lastSave: Date.now(),
    prestigePoints: state.prestigePoints,
    prestigeMilestones: state.prestigeMilestones,
    prestigeBonus: state.prestigeBonus,
    achievements: state.achievements,
    startTime: state.startTime,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    // No notification - always silent
  } catch (e) {
    console.error(e);
    // No notification even on error
  }
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    state.cookies = Number(data.cookies) || 0;
    state.totalCookies = Number(data.totalCookies) || 0;
    state.totalClicks = Number(data.totalClicks) || 0;
    state.upgrades = Object.assign({}, data.upgrades || {});
    state.cookieUpgrades = Object.assign({}, data.cookieUpgrades || {});
    state.lastSave = Number(data.lastSave) || Date.now();
    state.prestigePoints = Number(data.prestigePoints) || 0;
    state.prestigeMilestones = Object.assign({}, data.prestigeMilestones || {});
    state.prestigeBonus = Number(data.prestigeBonus) || 0;
    state.achievements = Object.assign({}, data.achievements || {});
    state.startTime = Number(data.startTime) || Date.now();
    recalcPrestigeMultiplier();
    // offline progress removed: do not award cookies while away
    // No notification for successful load
    return true;
  } catch (e) {
    console.error(e);
    // No notification for load error
    return false;
  }
}

function exportSave() {
  try {
    const payload = {
      cookies: state.cookies,
      totalCookies: state.totalCookies,
      totalClicks: state.totalClicks,
      upgrades: state.upgrades,
      lastSave: Date.now(),
      prestigePoints: state.prestigePoints,
      achievements: state.achievements,
      version: 2
    };
    const encoded = btoa(JSON.stringify(payload));
    $("#exportText").style.display = "block";
    $("#exportText").value = encoded;
    $("#exportText").select();
    // No notification
  } catch (e) {
    console.error(e);
    // No notification
  }
}

function importSave(saveData) {
  try {
    let data;
    try {
      // Try base64 decode first
      data = JSON.parse(atob(saveData));
    } catch {
      // Fallback to direct JSON
      data = JSON.parse(saveData);
    }

    state.cookies = Number(data.cookies) || 0;
    state.totalCookies = Number(data.totalCookies) || 0;
    state.totalClicks = Number(data.totalClicks) || 0;
    state.upgrades = Object.assign({}, data.upgrades || {});
    state.lastSave = Number(data.lastSave) || Date.now();
    state.prestigePoints = Number(data.prestigePoints) || 0;
    state.achievements = Object.assign({}, data.achievements || {});
    recalcPrestigeMultiplier();

    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      cookies: state.cookies,
      totalCookies: state.totalCookies,
      totalClicks: state.totalClicks,
      upgrades: state.upgrades,
      lastSave: state.lastSave,
      prestigePoints: state.prestigePoints,
      achievements: state.achievements,
    }));

    renderStats();
    renderShop();
    // No notification
    return true;
  } catch (e) {
    console.error(e);
    // No notification
    return false;
  }
}function hardReset() {
  if (!confirm("Hard reset all progress (no prestige)?")) return;
  Object.assign(state, {
    cookies: 0,
    totalCookies: 0,
    totalClicks: 0,
    upgrades: {},
    lastSave: 0,
    prestigePoints: 0,
    prestigeMultiplier: 1,
    achievements: {},
  });
  announced = new Set();
  localStorage.removeItem(STORAGE_KEY);
  renderStats();
  renderShop();
  renderCookieUpgrades();
  // No notification
}

// ===== Modal Management =====
function showModal(id) {
  const modal = $(id);
  modal.classList.add('show');
  modal.setAttribute('aria-hidden', 'false');
  // Focus first focusable element
  const focusable = modal.querySelector('button, input, textarea, [tabindex]');
  if (focusable) focusable.focus();
}

function hideModal(id) {
  const modal = $(id);
  modal.classList.remove('show');
  modal.setAttribute('aria-hidden', 'true');
}

function updateSettingsUI() {
  $("#autosaveToggle").checked = settings.autosave;
  $("#soundToggle").checked = settings.sound;
  $("#hapticsToggle").checked = settings.haptics;
}

// ===== Game Loop =====
function tick() {
  const now = performance.now();
  const dt = now - state.lastTick; // ms
  state.lastTick = now;

  // Auto-clicking
  if (state.autoClickEnabled && state.totalCookies >= AUTO_CLICK_UNLOCK) {
    // Auto-click at 2 clicks per second
    if (Math.random() < (dt / 1000) * 2) {
      onCookieClick({ clientX: 0, clientY: 0 });
    }
  }

  // Combo system removed

  const cps = totalCps();
  const gain = (cps * dt) / 1000;
  if (gain > 0) {
    addCookies(gain);
    // Gain experience from passive income (0.1 XP per cookie from CPS)
    gainExperience(gain * 0.1);
  }
  renderStats();
  throttledUpdateShopButtons();
  checkUnlocks();
  checkAchievements();

  // auto-buy timer tick (call autoBuyAttempt every 1s)
  window._autoBuyTimer = (window._autoBuyTimer || 0) + dt;
  if (window._autoBuyTimer >= 1000) {
    window._autoBuyTimer = 0;
    autoBuyAttempt();
  }
}

function start() {
  // Load settings first
  loadSettings();
  updateSettingsUI();
  updateAutosaveStatus();

  // Bind UI - Cookie clicking
  $("#cookieBtn").addEventListener("click", onCookieClick);

  // Keyboard support for cookie clicking
  $("#cookieBtn").addEventListener("keydown", (e) => {
    if (e.code === 'Space' || e.code === 'Enter') {
      e.preventDefault();
      onCookieClick({ clientX: 0, clientY: 0 }); // Fake event for floating animation
    }
  });

  // Global keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    if (e.target.tagName.toLowerCase() === 'input' || e.target.tagName.toLowerCase() === 'textarea') return;

    if (e.code === 'Space') {
      e.preventDefault();
      onCookieClick({ clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 });
    }
  });

  // Settings modal
  $("#settingsBtn").addEventListener("click", () => showModal("#settingsModal"));
  $("#closeSettings").addEventListener("click", () => hideModal("#settingsModal"));

  // Auto-click button
  $("#autoClickBtn").addEventListener("click", toggleAutoClick);
  // Auto-buy button
  const autoBuyBtn = $("#autoBuyBtn");
  if (autoBuyBtn) {
    autoBuyBtn.addEventListener('click', () => {
      state.autoBuyEnabled = !state.autoBuyEnabled;
      autoBuyBtn.textContent = state.autoBuyEnabled ? '🤖 Auto-Buy ON' : '🤖 Auto-Buy';
      autoBuyBtn.style.background = state.autoBuyEnabled ? 'linear-gradient(135deg, #4caf50, #45a049)' : '';
      save(true);
    });
  }

  // Settings toggles
  $("#autosaveToggle").addEventListener("change", (e) => {
    settings.autosave = e.target.checked;
    saveSettings();
    updateAutosaveStatus();
  });
  $("#soundToggle").addEventListener("change", (e) => {
    settings.sound = e.target.checked;
    saveSettings();
    if (settings.sound) playSound(800, 100); // Test sound
  });
  $("#hapticsToggle").addEventListener("change", (e) => {
    settings.haptics = e.target.checked;
    saveSettings();
    if (settings.haptics) hapticFeedback('medium'); // Test haptic
  });

  // Save management
  $("#manualSave").addEventListener("click", save);
  $("#manualLoad").addEventListener("click", () => {
    if (load()) {
      renderStats();
      renderShop();
      hideModal("#settingsModal");
    }
  });
  $("#exportSave").addEventListener("click", exportSave);
  $("#importSave").addEventListener("click", () => $("#importFile").click());
  $("#importFile").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (importSave(e.target.result)) {
        hideModal("#settingsModal");
      }
    };
    reader.readAsText(file);
  });

  // Danger zone
  $("#hardReset").addEventListener("click", () => {
    hardReset();
    hideModal("#settingsModal");
  });

  // Prestige
  $("#prestigeBtn").addEventListener("click", performPrestige);

  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Modal outside click
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal")) {
      hideModal("#settingsModal");
    }
  });

  // Init
  recalcPrestigeMultiplier();
  const loaded = load();
  if (!loaded) {
    renderStats();
  }
  renderShop();
  renderCookieUpgrades();
  switchTab('buildings'); // Default tab

  // Show auto-buy button once unlocked (e.g., after first 1k total cookies)
  const autoBuyVisible = state.totalCookies >= 1000;
  if (autoBuyBtn) autoBuyBtn.style.display = autoBuyVisible ? 'inline-block' : 'none';

  // Loop
  state.lastTick = performance.now();
  setInterval(tick, TICK_MS);

  // Initial autosave setup
  updateAutosaveStatus();
}

// Start when DOM ready
document.addEventListener("DOMContentLoaded", start);

// ===== Save/Load Modal System =====

// Modal management
function showSaveModal() {
  document.getElementById('saveModal').classList.add('show');
}

function closeSaveModal() {
  document.getElementById('saveModal').classList.remove('show');
}

function showSettingsModal() {
  document.getElementById('settingsModal').classList.add('show');
}

function closeSettingsModal() {
  document.getElementById('settingsModal').classList.remove('show');
}

// Save slot management
function saveToSlot(slot) {
  const saveData = createSaveData();
  localStorage.setItem(`${STORAGE_KEY}-slot${slot}`, saveData);
  showMessage(`Game saved to slot ${slot}!`, "success");
}

function loadFromSlot(slot) {
  const saveData = localStorage.getItem(`${STORAGE_KEY}-slot${slot}`);
  if (saveData) {
    if (loadFromString(saveData)) {
      showMessage(`Game loaded from slot ${slot}!`, "success");
      closeSaveModal();
    } else {
      showMessage(`Failed to load from slot ${slot}`, "error");
    }
  } else {
    showMessage(`No save found in slot ${slot}`, "error");
  }
}

// Export/Import functionality
function exportSave() {
  const saveData = createSaveData();
  document.getElementById('saveData').value = saveData;
  document.getElementById('saveData').select();
  document.execCommand('copy');
  showMessage("Save data copied to clipboard!", "success");
}

function importSave() {
  const saveData = document.getElementById('saveData').value.trim();
  if (saveData) {
    if (loadFromString(saveData)) {
      showMessage("Save data imported successfully!", "success");
      closeSaveModal();
    } else {
      showMessage("Invalid save data", "error");
    }
  } else {
    showMessage("Please paste save data first", "error");
  }
}

// Helper functions for save/load
function createSaveData() {
  return JSON.stringify({
    cookies: state.cookies,
    totalCookies: state.totalCookies,
    clickPower: state.clickPower,
    cps: state.cps,
    buildings: state.buildings,
    cookieUpgrades: state.cookieUpgrades,
    achievements: state.achievements,
    totalClicks: state.totalClicks,
    startTime: state.startTime,
    prestigeLevel: state.prestigeLevel,
    prestigePoints: state.prestigePoints,
    prestigeUpgrades: state.prestigeUpgrades
  });
}

function loadFromString(saveString) {
  try {
    const data = JSON.parse(saveString);

    // Validate essential properties
    if (typeof data.cookies !== 'number' || data.cookies < 0) return false;

    // Load the data
    state.cookies = data.cookies || 0;
    state.totalCookies = data.totalCookies || 0;
    state.clickPower = data.clickPower || 1;
    state.cps = data.cps || 0;
    state.buildings = data.buildings || {};
    state.cookieUpgrades = data.cookieUpgrades || [];
    state.achievements = data.achievements || [];
    state.totalClicks = data.totalClicks || 0;
    state.startTime = data.startTime || Date.now();
    state.prestigeLevel = data.prestigeLevel || 0;
    state.prestigePoints = data.prestigePoints || 0;
    state.prestigeUpgrades = data.prestigeUpgrades || [];

    // Recalculate derived values
    recalculateEverything();
    renderStats();
    renderShop();
    renderCookieUpgrades();
    // remove focus from the prestige button to avoid focus outlines/horizontal line
    const prestBtn = document.getElementById('prestigeBtn');
    if (prestBtn && typeof prestBtn.blur === 'function') prestBtn.blur();

    return true;
  } catch (e) {
    console.error("Failed to load save:", e);
    return false;
  }
}

// Add event listeners for controls
document.addEventListener("DOMContentLoaded", () => {
  // Control buttons
  document.getElementById('save-btn')?.addEventListener('click', showSaveModal);
  document.getElementById('load-btn')?.addEventListener('click', showSaveModal);
  document.getElementById('settings-btn')?.addEventListener('click', showSettingsModal);

  // Modal close events
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
      closeSaveModal();
      closeSettingsModal();
    }
  });

  // ESC key to close modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeSaveModal();
      closeSettingsModal();
    }
  });
});

// Helper functions for new features
// combo display removed

function checkAutoClickUnlock() {
  const autoBtn = $("#autoClickBtn");
  if (state.totalCookies >= AUTO_CLICK_UNLOCK) {
    autoBtn.style.display = "inline-block";
  }
}

function toggleAutoClick() {
  state.autoClickEnabled = !state.autoClickEnabled;
  const autoBtn = $("#autoClickBtn");
  autoBtn.textContent = state.autoClickEnabled ? "🖱️ ON" : "🖱️ Auto";
  autoBtn.style.background = state.autoClickEnabled ?
    "linear-gradient(135deg, #4caf50, #45a049)" :
    "linear-gradient(to bottom, var(--button-hover), var(--button-bg))";
}

function updateClickRate() {
  const now = Date.now();
  state.clickRateHistory.push({ time: now, clicks: state.clicksThisSecond });

  // Keep only last 10 seconds
  state.clickRateHistory = state.clickRateHistory.filter(entry =>
    now - entry.time < 10000
  );

  // Calculate average clicks per second
  const totalClicks = state.clickRateHistory.reduce((sum, entry) => sum + entry.clicks, 0);
  const timeSpan = Math.min(10, state.clickRateHistory.length);
  const clickRate = timeSpan > 0 ? (totalClicks / timeSpan).toFixed(1) : "0.0";

  $("#clickRate").textContent = clickRate;
  state.clicksThisSecond = 0;
}

function createFloatingText(text, x, y) {
  const floatLayer = $("#floatLayer");
  const element = document.createElement('div');
  element.textContent = text;
  element.style.cssText = `
    position: absolute;
    left: ${x - 25}px;
    top: ${y - 10}px;
    color: #ffd700;
    font-weight: bold;
    font-size: 16px;
    pointer-events: none;
    z-index: 1000;
    text-shadow: 0 0 10px rgba(255, 215, 0, 0.8);
    animation: floatUp 1s ease-out forwards;
  `;

  // Add CSS animation if not exists
  if (!document.getElementById('floatUpAnimation')) {
    const style = document.createElement('style');
    style.id = 'floatUpAnimation';
    style.textContent = `
      @keyframes floatUp {
        0% { opacity: 1; transform: translateY(0px) scale(1); }
        100% { opacity: 0; transform: translateY(-50px) scale(1.2); }
      }
    `;
    document.head.appendChild(style);
  }

  floatLayer.appendChild(element);
  setTimeout(() => element.remove(), 1000);
}

// Start click rate tracking
setInterval(updateClickRate, 1000);
