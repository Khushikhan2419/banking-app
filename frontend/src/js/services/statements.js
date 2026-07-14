/* ---------------- Statements — "Paper Trail" theme ---------------- */
async function renderStatements() {
  const main = document.getElementById("main");
  const mine = await myAccountOrNull();
  main.innerHTML = pageHeader("Statements", "Your account activity") + (mine ? `
    <div class="card fade-in st-letterhead">
      <div class="st-letterhead-top">
        <div class="st-letterhead-brand">VeeraBank</div>
        <div class="st-letterhead-addr">Official Statement of Account</div>
      </div>
      <h2>Statement for ${mine.account_number}</h2>
      <div class="split" style="gap:10px;">
        <div><label>From</label><input id="st_from" type="date" /></div>
        <div><label>To</label><input id="st_to" type="date" /></div>
        <button class="btn" onclick="loadStatement()" style="align-self:flex-end;">Run</button>
      </div>
      <div id="st_summary" style="margin:14px 0;"></div>
      <div id="st_list"><div class="empty">Loading…</div></div>
    </div>
  ` : noAccountCard("statements"));
  if (mine) loadStatement();
}
async function loadStatement() {
  const mine = cachedAccounts[0];
  const box = document.getElementById("st_list"), sum = document.getElementById("st_summary");
  try {
    const from = document.getElementById("st_from").value, to = document.getElementById("st_to").value;
    const q = new URLSearchParams(); if (from) q.set("from_date", from); if (to) q.set("to_date", to);
    const s = await api(`/statements/${mine.account_id}?${q}`);
    sum.innerHTML = `<div class="split" style="gap:20px;">
      <div><div style="font-size:11px; color:var(--muted-2);">CREDITS</div><div class="amt pos" style="font-family:var(--mono);">+$${fmtMoney(s.total_credits)}</div></div>
      <div><div style="font-size:11px; color:var(--muted-2);">DEBITS</div><div class="amt neg" style="font-family:var(--mono);">−$${fmtMoney(s.total_debits)}</div></div>
      <div><div style="font-size:11px; color:var(--muted-2);">BALANCE</div><div style="font-family:var(--mono);">$${fmtMoney(s.current_balance)}</div></div>
    </div>`;
    box.innerHTML = s.lines.length ? s.lines.map(l => row(l.description, `<span class="amt ${l.amount<0?'neg':'pos'}" style="font-family:var(--mono);">${l.amount<0?'−':'+'}$${fmtMoney(Math.abs(l.amount))}</span>`, fmtWhen(l.date))).join("")
      : `<div class="empty">No activity in this period.</div>`;
  } catch (e) { box.innerHTML = `<div class="empty">${e.message}</div>`; }
}
