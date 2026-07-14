/* ---------------- Beneficiaries — "Rolodex" theme ---------------- */
async function renderBeneficiaries() {
  const main = document.getElementById("main");
  main.innerHTML = pageHeader("Beneficiaries", "Saved payees") + `
    <div class="bn-tab">◎ Rolodex — saved payees</div>
    <div class="grid cols-2">
      <div class="card fade-in">
        <h2>Add a beneficiary</h2>
        <p class="hint">Verified against a real VeeraBank account number.</p>
        <label>Account number</label><input id="bn_number" placeholder="e.g. 48219047335" />
        <label>Nickname (optional)</label><input id="bn_nickname" placeholder="Mom, Landlord, ..." />
        <button class="btn" onclick="doAddBeneficiary()">Add</button>
        <div id="bn_msg"></div>
      </div>
      <div class="card fade-in"><h2>Your beneficiaries</h2><div id="bn_list"><div class="empty">Loading…</div></div></div>
    </div>
  `;
  loadBeneficiaries();
}
async function doAddBeneficiary() {
  const el = document.getElementById("bn_msg");
  try {
    const body = { user_id: currentUser.user_id, account_number: document.getElementById("bn_number").value, nickname: document.getElementById("bn_nickname").value };
    await api("/beneficiaries", { method: "POST", body: JSON.stringify(body) });
    el.innerHTML = `<div class="msg ok">Added.</div>`; toast("Beneficiary added.");
    loadBeneficiaries();
  } catch (e) { el.innerHTML = `<div class="msg err">${e.message}</div>`; }
}
async function loadBeneficiaries() {
  const box = document.getElementById("bn_list");
  try {
    const list = await api(`/beneficiaries/user/${currentUser.user_id}`);
    box.innerHTML = list.length ? list.map(b => row(
      b.nickname, `<button class="btn ghost sm" onclick="doRemoveBeneficiary('${b.id}')">Remove</button>`, b.account_number
    )).join("") : `<div class="empty"><div class="big">No beneficiaries yet</div>Add someone you send money to often.</div>`;
  } catch (e) { box.innerHTML = `<div class="empty">${e.message}</div>`; }
}
async function doRemoveBeneficiary(id) {
  try { await api(`/beneficiaries/${id}`, { method: "DELETE" }); toast("Removed."); loadBeneficiaries(); }
  catch (e) { toast(e.message, false); }
}
