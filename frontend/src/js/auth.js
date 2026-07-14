function renderGate() {
  document.getElementById("app").innerHTML = `
    <div class="gate">
      <div class="gate-card fade-in">
        <div class="gate-visual">
          <div class="brand">
            <div class="mark">V</div>
            <div class="word" style="color:#eef1f8">Veera<b>Bank</b></div>
          </div>
          <div>
            <div class="quote">Every balance is <span>a ledger</span>, every transfer <span>a promise kept</span>.</div>
            <div class="foot" style="margin-top:22px;">SECURE · CLOUD-NATIVE · 20 SERVICES ON EKS</div>
          </div>
        </div>
        <div class="gate-form">
          <div class="eyebrow">Welcome back</div>
          <div class="pagetitle" style="font-size:24px;">Sign in to VeeraBank</div>
          <div class="tabs">
            <button class="${authTab==='login'?'active':''}" onclick="setAuthTab('login')">Login</button>
            <button class="${authTab==='register'?'active':''}" onclick="setAuthTab('register')">Register</button>
          </div>
          <div id="auth-body"></div>
        </div>
      </div>
    </div>
  `;
  renderAuthBody();
}
function setAuthTab(t){ authTab = t; renderGate(); }

function renderAuthBody() {
  const el = document.getElementById("auth-body");
  if (authTab === "login") {
    el.innerHTML = `
      <label>Email</label><input id="l_email" type="email" placeholder="you@veerabank.com" />
      <label>Password</label><input id="l_password" type="password" placeholder="••••••••" />
      <button class="btn" style="width:100%" onclick="doLogin()">Sign in</button>
      <div id="l_msg"></div>
    `;
  } else {
    el.innerHTML = `
      <label>Full name</label><input id="r_name" placeholder="Ada Lovelace" />
      <label>Email</label><input id="r_email" type="email" placeholder="you@veerabank.com" />
      <label>Phone</label><input id="r_phone" placeholder="+1 555 000 1234" />
      <label>Password</label><input id="r_password" type="password" placeholder="Create a password" />
      <button class="btn gold" style="width:100%" onclick="doRegister()">Create account</button>
      <div id="r_msg"></div>
    `;
  }
}

async function doRegister() {
  const el = document.getElementById("r_msg");
  try {
    const body = {
      full_name: document.getElementById("r_name").value,
      email: document.getElementById("r_email").value,
      phone: document.getElementById("r_phone").value,
      password: document.getElementById("r_password").value,
    };
    const user = await api("/users/register", { method: "POST", body: JSON.stringify(body) });
    setUser(user);
    toast("Account created — welcome to VeeraBank.");
    currentTab = "dashboard";
    afterAuth();
  } catch (e) { el.innerHTML = `<div class="msg err">${e.message}</div>`; }
}
async function doLogin() {
  const el = document.getElementById("l_msg");
  try {
    const body = {
      email: document.getElementById("l_email").value,
      password: document.getElementById("l_password").value,
    };
    const user = await api("/users/login", { method: "POST", body: JSON.stringify(body) });
    setUser(user);
    toast(`Welcome back, ${user.full_name.split(" ")[0]}.`);
    currentTab = "dashboard";
    afterAuth();
  } catch (e) { el.innerHTML = `<div class="msg err">${e.message}</div>`; }
}
function doLogout(){ setUser(null); render(); }

/* After every successful login/register, check whether this person has
   an account yet - if not, take them straight to the dashboard AND pop
   the "open your account" modal on top of it, instead of dropping them
   on an empty dashboard with no explanation. See js/onboarding.js. */
async function afterAuth() {
  await render();
  try {
    const accounts = await fetchMyAccounts();
    if (!accounts.length) openOnboarding();
  } catch (e) {}
}
