/* ---------------- Rewards — "Arcade" theme ---------------- */
async function renderRewards() {
  const main = document.getElementById("main");
  main.innerHTML = pageHeader("Rewards", "Points from banking") + `
    <div class="grid cols-2">
      <div class="card fade-in rw-glow">
        <h2>Your balance</h2>
        <div class="rw-badge-row">★ ★ ★</div>
        <div id="rw_balance" style="font-family:var(--mono); font-size:32px; margin:10px 0;">…</div>
        <p class="hint">Earn 1 point per $100 transferred. Redeem below.</p>
        <label>Points to redeem</label><input id="rw_points" type="number" min="1" placeholder="100" />
        <button class="btn" onclick="doRedeem()">Redeem</button>
        <div id="rw_msg"></div>
      </div>
      <div class="card fade-in"><h2>History</h2><div id="rw_list"><div class="empty">Loading…</div></div></div>
    </div>
  `;
  loadRewards();
}
async function loadRewards() {
  try {
    const bal = await api(`/rewards/user/${currentUser.user_id}/balance`);
    document.getElementById("rw_balance").textContent = `${bal.points_balance} pts`;
    const items = await api(`/rewards/user/${currentUser.user_id}`);
    document.getElementById("rw_list").innerHTML = items.length ? items.map(r => row(
      r.description, `<span class="amt ${r.kind==='earn'?'pos':'neg'}">${r.kind==='earn'?'+':'−'}${r.points}</span>`, fmtWhen(r.created_at)
    )).join("") : `<div class="empty">No activity yet.</div>`;
  } catch (e) { document.getElementById("rw_list").innerHTML = `<div class="empty">${e.message}</div>`; }
}
async function doRedeem() {
  const el = document.getElementById("rw_msg");
  try {
    const body = { user_id: currentUser.user_id, points: Number(document.getElementById("rw_points").value) };
    await api("/rewards/redeem", { method: "POST", body: JSON.stringify(body) });
    el.innerHTML = `<div class="msg ok">Redeemed.</div>`; toast("Redeemed.");
    loadRewards();
  } catch (e) { el.innerHTML = `<div class="msg err">${e.message}</div>`; }
}
