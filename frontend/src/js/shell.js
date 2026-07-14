const ICONS = {
  dashboard:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="5" rx="1.5"/><rect x="13" y="10" width="8" height="11" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/></svg>',
  accounts:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2.5" y="6" width="19" height="13" rx="2"/><path d="M2.5 10h19"/><path d="M6 15h4"/></svg>',
  transactions:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 7h13l-3-3M20 17H7l3 3"/></svg>',
  transfers:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M17 7l4 4-4 4M21 11H3M7 3l-4 4 4 4M3 7h18"/></svg>',
  services:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>',
};
function iconFor(key){ return ICONS[key] || ICONS.services; }

function renderShell() {
  document.getElementById("app").innerHTML = `
    <div class="shell">
      <aside class="sidebar">
        <div class="brand">
          <div class="mark">V</div>
          <div class="word">Veera<b>Bank</b></div>
        </div>
        <nav class="navgroup" id="nav-primary">
          <div class="label">Overview</div>
        </nav>
        <nav class="navgroup" id="nav-secondary"></nav>
        <div class="sidebar-foot">
          <div class="who">
            <div class="avatar">${initials(currentUser.full_name)}</div>
            <div class="meta">
              <div class="name">${currentUser.full_name}</div>
              <div class="sub">${currentUser.email}</div>
            </div>
          </div>
          <button class="signout" onclick="doLogout()">Sign out →</button>
        </div>
      </aside>
      <main id="main"></main>
    </div>
  `;
  renderNav();
}

function renderNav() {
  const primary = document.getElementById("nav-primary");
  const secondary = document.getElementById("nav-secondary");
  const mk = (key, label, icon) => {
    const b = document.createElement("button");
    b.className = "navitem" + (key === currentTab ? " active" : "");
    b.innerHTML = `${icon}<span>${label}</span>`;
    b.onclick = () => { currentTab = key; render(); };
    return b;
  };
  primary.innerHTML = `<div class="label">Overview</div>`;
  [["dashboard","Dashboard",iconFor("dashboard")], ["accounts","Accounts",iconFor("accounts")],
   ["transfers","Transfers",iconFor("transfers")],
   ["transactions","Transactions",iconFor("transactions")]].forEach(([k,l,i]) => primary.appendChild(mk(k,l,i)));

  secondary.innerHTML = `<div class="label">Services</div>`;
  const b = document.createElement("button");
  b.className = "navitem" + (currentTab === "services" ? " active" : "");
  b.innerHTML = `${iconFor("services")}<span>All services (${GENERIC_SERVICES.length})</span>`;
  b.onclick = () => { currentTab = "services"; render(); };
  secondary.appendChild(b);
}

function pageHeader(eyebrow, title) {
  return `
    <div class="topline">
      <div>
        <div class="eyebrow">${eyebrow}</div>
        <div class="pagetitle">${title}</div>
      </div>
      <div class="clock" id="clock"></div>
    </div>
  `;
}
function tickClock() {
  const el = document.getElementById("clock");
  if (!el) return;
  el.textContent = new Date().toLocaleString(undefined, { weekday:"short", month:"short", day:"numeric", hour:"2-digit", minute:"2-digit", second:"2-digit" });
}
setInterval(tickClock, 1000);

/* ---------------------------------------------------------------------- */
async function render() {
  if (!currentUser) { renderGate(); return; }
  renderShell();
  // Every tab/service renders inside #main wearing its own theme class —
  // this is the single hook that gives each "server" page its completely
  // separate look (colors, type, shapes) without touching page logic.
  document.getElementById("main").className = "themed theme-" + currentTab;
  if (currentTab === "dashboard") await renderDashboard();
  else if (currentTab === "accounts") await renderAccounts();
  else if (currentTab === "transfers") await renderTransfers();
  else if (currentTab === "transactions") await renderTransactions();
  else if (currentTab === "services") renderServices();
  else if (SERVICE_PAGES[currentTab]) await SERVICE_PAGES[currentTab]();
  tickClock();
}

/* ---------------------------------------------------------------------- */
/* Full-screen "View" overlay — lets someone preview a service's theme and
   live headline stat at big-screen size before committing to open it. */
async function openBigView(key) {
  const label = (key || "").replace(/-/g, " ");
  const wrap = document.createElement("div");
  wrap.className = "bigview-backdrop theme-" + key;
  wrap.id = "bigview-backdrop";
  wrap.onclick = (e) => { if (e.target === wrap) closeBigView(); };
  wrap.innerHTML = `
    <div class="bigview fade-in">
      <button class="bigview-close" onclick="closeBigView()">✕</button>
      <div class="bigview-eyebrow">${iconFor("services")} VeeraBank · microservice preview</div>
      <div class="bigview-title">${label}</div>
      <div class="bigview-icon">${SERVICE_ICONS[key] || "◆"}</div>
      <div class="bigview-stat" id="bigview-stat">Loading preview…</div>
      <p class="bigview-desc">${SERVICE_BLURBS[key] || "Open this service to see live data."}</p>
      <button class="btn bigview-open" onclick="closeBigView(); currentTab='${key}'; render();">Open ${label} →</button>
    </div>
  `;
  document.body.appendChild(wrap);
  document.addEventListener("keydown", bigViewEsc);
  try {
    const stat = await SERVICE_PREVIEW[key]?.();
    const el = document.getElementById("bigview-stat");
    if (el) el.textContent = stat || "Ready.";
  } catch (e) {
    const el = document.getElementById("bigview-stat");
    if (el) el.textContent = "Sign in required to preview live data.";
  }
}
function bigViewEsc(e){ if (e.key === "Escape") closeBigView(); }
function closeBigView() {
  const el = document.getElementById("bigview-backdrop");
  if (el) el.remove();
  document.removeEventListener("keydown", bigViewEsc);
}
