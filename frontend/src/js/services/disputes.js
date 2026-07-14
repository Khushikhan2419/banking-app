/* ---------------- Disputes — "Case File" theme ---------------- */
async function renderDisputes() {
  const main = document.getElementById("main");
  const mine = await myAccountOrNull();
  let options = "";
  if (mine) {
    try { const transfers = await api(`/transfers/account/${mine.account_id}`); options = transfers.map(t => `<option value="${t.id}">${fmtWhen(t.created_at)} · $${fmtMoney(t.amount)}</option>`).join(""); } catch (e) {}
  }
  main.innerHTML = pageHeader("Disputes", "Flag a transfer") + `
    <div class="ds-folder-tab">CASE FILE · OPEN DISPUTE</div>
    <div class="grid cols-2">
      <div class="card fade-in">
        <h2>Raise a dispute</h2>
        <label>Transfer</label><select id="ds_transfer">${options || '<option value="">No transfers yet</option>'}</select>
        <label>Reason</label><input id="ds_reason" placeholder="Didn't authorize this" />
        <button class="btn" onclick="doRaiseDispute()">Submit</button>
        <div id="ds_msg"></div>
      </div>
      <div class="card fade-in"><h2>Your disputes</h2><div id="ds_list"><div class="empty">Loading…</div></div></div>
    </div>
  `;
  loadDisputes();
}
async function doRaiseDispute() {
  const el = document.getElementById("ds_msg");
  try {
    const transferId = document.getElementById("ds_transfer").value;
    if (!transferId) throw new Error("No transfer selected.");
    const body = { user_id: currentUser.user_id, transfer_id: transferId, reason: document.getElementById("ds_reason").value };
    await api("/disputes", { method: "POST", body: JSON.stringify(body) });
    el.innerHTML = `<div class="msg ok">Dispute filed.</div>`; toast("Dispute filed.");
    loadDisputes();
  } catch (e) { el.innerHTML = `<div class="msg err">${e.message}</div>`; }
}
async function loadDisputes() {
  const box = document.getElementById("ds_list");
  try {
    const items = await api(`/disputes/user/${currentUser.user_id}`);
    box.innerHTML = items.length ? items.map(d => row(d.reason, badge('', d.status), fmtWhen(d.created_at))).join("")
      : `<div class="empty"><div class="big">No disputes</div>Nothing flagged.</div>`;
  } catch (e) { box.innerHTML = `<div class="empty">${e.message}</div>`; }
}
