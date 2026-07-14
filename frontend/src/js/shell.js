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
  b.innerHTML = `${iconFor("services")}<span>All services (16)</span>`;
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
  if (currentTab === "dashboard") await renderDashboard();
  else if (currentTab === "accounts") await renderAccounts();
  else if (currentTab === "transfers") await renderTransfers();
  else if (currentTab === "transactions") await renderTransactions();
  else if (currentTab === "services") renderServices();
  else if (SERVICE_PAGES[currentTab]) await SERVICE_PAGES[currentTab]();
  tickClock();
}
