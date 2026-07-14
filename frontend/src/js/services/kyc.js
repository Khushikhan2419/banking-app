/* ---------------- KYC — "Verify Wizard" theme ---------------- */
async function renderKyc() {
  const main = document.getElementById("main");
  main.innerHTML = pageHeader("KYC", "Identity verification") + `
    <div class="kyc-steps">
      <div class="kyc-step active"><span>1</span>Submit</div>
      <div class="kyc-step-line"></div>
      <div class="kyc-step"><span>2</span>Review</div>
      <div class="kyc-step-line"></div>
      <div class="kyc-step"><span>3</span>Verified</div>
    </div>
    <div class="grid cols-2">
      <div class="card fade-in">
        <h2>Submit documents</h2>
        <label>Document type</label>
        <select id="kc_type"><option value="passport">Passport</option><option value="national_id">National ID</option><option value="drivers_license">Driver's license</option></select>
        <label>Document number</label><input id="kc_number" placeholder="e.g. X1234567" />
        <button class="btn" onclick="doSubmitKyc()">Submit</button>
        <div id="kc_msg"></div>
      </div>
      <div class="card fade-in"><h2>Your submissions</h2><div id="kc_list"><div class="empty">Loading…</div></div></div>
    </div>
  `;
  loadKyc();
}
async function doSubmitKyc() {
  const el = document.getElementById("kc_msg");
  try {
    const body = { user_id: currentUser.user_id, document_type: document.getElementById("kc_type").value, document_number: document.getElementById("kc_number").value };
    await api("/kyc/submit", { method: "POST", body: JSON.stringify(body) });
    el.innerHTML = `<div class="msg ok">Submitted for review.</div>`; toast("KYC submitted.");
    loadKyc();
  } catch (e) { el.innerHTML = `<div class="msg err">${e.message}</div>`; }
}
async function loadKyc() {
  const box = document.getElementById("kc_list");
  try {
    const items = await api(`/kyc/user/${currentUser.user_id}`);
    box.innerHTML = items.length ? items.map(k => row(`${k.document_type.replace('_',' ')} · ${k.document_number}`, badge('', k.status), fmtWhen(k.created_at))).join("")
      : `<div class="empty"><div class="big">Not submitted yet</div>Verify your identity to unlock full limits.</div>`;
  } catch (e) { box.innerHTML = `<div class="empty">${e.message}</div>`; }
}
