/* ---------------- Services hub — directory of every microservice ---------------- */
const SERVICE_PAGES = {
  cards: renderCards, loans: renderLoans, payments: renderPayments, beneficiaries: renderBeneficiaries,
  statements: renderStatements, notifications: renderNotifications, kyc: renderKyc, "fixed-deposits": renderFixedDeposits,
  cheques: renderCheques, disputes: renderDisputes, "audit-log": renderAuditLog, "fraud-detection": renderFraudDetection,
  "support-tickets": renderSupportTickets, rewards: renderRewards, admin: renderAdmin, reports: renderReports,
};

const SERVICE_BLURBS = {
  cards: "Neon-glass virtual card wall — issue, flip, freeze.",
  loans: "Editorial credit desk — apply and track EMI schedules.",
  payments: "Terminal-style bill pay ledger.",
  beneficiaries: "A warm rolodex of saved payees.",
  statements: "Letterhead-styled official account statements.",
  notifications: "A calm, pulsing activity timeline.",
  kyc: "Step-by-step identity verification wizard.",
  "fixed-deposits": "Vault-grade gold FD certificates.",
  cheques: "A perforated, paper chequebook.",
  disputes: "Legal-style case files for flagged transfers.",
  "audit-log": "Black-box terminal feed of every action.",
  "fraud-detection": "Radar-lit console for flagged transfers.",
  "support-tickets": "Soft helpdesk thread view.",
  rewards: "Arcade-bright points & badges.",
  admin: "Slate ops-command console for staff.",
  reports: "Chart-forward, bank-wide analytics studio.",
};

const SERVICE_PREVIEW = {
  cards: async () => { const c = await api(`/cards/user/${currentUser.user_id}`); return `${c.length} card${c.length===1?'':'s'} on file`; },
  loans: async () => { const l = await api(`/loans/user/${currentUser.user_id}`); return `${l.length} loan${l.length===1?'':'s'}`; },
  payments: async () => { const p = await api(`/payments/user/${currentUser.user_id}`); return `${p.length} payment${p.length===1?'':'s'} made`; },
  beneficiaries: async () => { const b = await api(`/beneficiaries/user/${currentUser.user_id}`); return `${b.length} saved payee${b.length===1?'':'s'}`; },
  statements: async () => { const mine = cachedAccounts[0] || await myAccountOrNull(); return mine ? `Account ${mine.account_number}` : "No account yet"; },
  notifications: async () => { const n = await api(`/notifications/user/${currentUser.user_id}`); return `${n.filter(x=>!x.read).length} unread`; },
  kyc: async () => { const k = await api(`/kyc/user/${currentUser.user_id}`); return k.length ? `Status: ${k[k.length-1].status}` : "Not submitted"; },
  "fixed-deposits": async () => { const f = await api(`/fixed-deposits/user/${currentUser.user_id}`); return `${f.length} deposit${f.length===1?'':'s'}`; },
  cheques: async () => { const c = await api(`/cheques/user/${currentUser.user_id}`); return `${c.length} cheque${c.length===1?'':'s'} issued`; },
  disputes: async () => { const d = await api(`/disputes/user/${currentUser.user_id}`); return `${d.length} dispute${d.length===1?'':'s'} filed`; },
  "audit-log": async () => { const a = await api(`/audit-log/all`); return `${a.length} events logged`; },
  "fraud-detection": async () => { const f = await api(`/fraud-detection/flags`); return `${f.filter(x=>x.status==='open').length} open flags`; },
  "support-tickets": async () => { const t = await api(`/support-tickets/user/${currentUser.user_id}`); return `${t.length} ticket${t.length===1?'':'s'}`; },
  rewards: async () => { const b = await api(`/rewards/user/${currentUser.user_id}/balance`); return `${b.points_balance} points`; },
  admin: async () => { const o = await api(`/admin/overview`); return `${o.total_users} users · ${o.total_accounts} accounts`; },
  reports: async () => { const r = await api(`/reports/summary`); return `$${fmtMoney(r.total_balance_across_bank)} total balance`; },
};

function renderServices() {
  const main = document.getElementById("main");
  main.innerHTML = pageHeader("Services", "Every VeeraBank feature — each on its own microservice, each with its own look") + `
    <div class="grid cols-3">
      ${GENERIC_SERVICES.map(s => `
        <div class="card fade-in svc-tile theme-${s}">
          <div class="svc-tile-top">
            <div class="icon">${SERVICE_ICONS[s] || "◆"}</div>
            <button class="svc-view-btn" title="Big-screen preview" onclick="event.stopPropagation(); openBigView('${s}')">⤢ View</button>
          </div>
          <button class="svc-tile-body" onclick="currentTab='${s}'; render();">
            <h2>${s.replace('-',' ')}</h2>
            <p class="hint">${SERVICE_BLURBS[s] || `Open ${s.replace('-',' ')}`}</p>
          </button>
        </div>
      `).join("")}
    </div>
  `;
}
