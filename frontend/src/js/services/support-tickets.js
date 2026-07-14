/* ---------------- Support Tickets — "Helpdesk" theme ---------------- */
async function renderSupportTickets() {
  const main = document.getElementById("main");
  main.innerHTML = pageHeader("Support", "Get help") + `
    <div class="tk-bubble-intro">💬 We usually reply within a few hours.</div>
    <div class="grid cols-2">
      <div class="card fade-in">
        <h2>Raise a ticket</h2>
        <label>Subject</label><input id="tk_subject" placeholder="Trouble with a transfer" />
        <label>Message</label><input id="tk_message" placeholder="Describe the issue" />
        <button class="btn" onclick="doCreateTicket()">Submit</button>
        <div id="tk_msg"></div>
      </div>
      <div class="card fade-in"><h2>Your tickets</h2><div id="tk_list"><div class="empty">Loading…</div></div></div>
    </div>
  `;
  loadTickets();
}
async function doCreateTicket() {
  const el = document.getElementById("tk_msg");
  try {
    const body = { user_id: currentUser.user_id, subject: document.getElementById("tk_subject").value, message: document.getElementById("tk_message").value };
    await api("/support-tickets", { method: "POST", body: JSON.stringify(body) });
    el.innerHTML = `<div class="msg ok">Ticket opened.</div>`; toast("Ticket opened.");
    loadTickets();
  } catch (e) { el.innerHTML = `<div class="msg err">${e.message}</div>`; }
}
async function loadTickets() {
  const box = document.getElementById("tk_list");
  try {
    const items = await api(`/support-tickets/user/${currentUser.user_id}`);
    box.innerHTML = items.length ? items.map(t => row(
      t.subject, badge('', t.status), (t.messages||[]).map(m => `${m.from_staff ? 'Staff' : 'You'}: ${m.message}`).join(' · ')
    )).join("") : `<div class="empty"><div class="big">No tickets</div>You're all set.</div>`;
  } catch (e) { box.innerHTML = `<div class="empty">${e.message}</div>`; }
}
