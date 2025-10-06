/*
  SolarCoin P2P Trading — browser-only sandbox
  - 4 prosumers (P1..P4) + external grid
  - 24h horizon, 5-min step (T=288)
  - User enters P1 daily demand (kWh). Others use defaults.
  - Simulate PV + demand profiles, P2P matching, TOU external prices.
  - Compute internal energy/amounts and wallet balances in SLR.
*/

const T = 288; // 24h / 5min
const dtH = 5 / 60; // hours per step
const names = ["P1", "P2", "P3", "P4"];

// Starting wallet balance (SLR)
const START_BAL = 100;

// Default total daily demands (kWh)
const DEFAULT_DEMANDS = [20, 18, 12, 8];

// PV peak capacity for each prosumer (kW)
const PV_CAP = [3.0, 2.0, 4.0, 1.0];

// Chart handles
let energyChart, amountChart, donutChart, balanceChart;

function timeLabels() {
  const labels = [];
  for (let t = 0; t < T; t++) {
    const minutes = t * 5;
    const hh = Math.floor(minutes / 60);
    const mm = minutes % 60;
    labels.push(`${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`);
  }
  return labels;
}

// Smooth load profile (unit area). Heavier evening, some morning peak.
function baseLoadShape() {
  const arr = new Array(T).fill(0);
  function gauss(center, width, amp) {
    for (let t = 0; t < T; t++) {
      const x = t - center;
      arr[t] += amp * Math.exp(-(x * x) / (2 * width * width));
    }
  }
  // morning peak (7:00 ~ 9:00), evening peak (18:00 ~ 22:00)
  gauss(7 * 12 + 0, 18, 1.0);
  gauss(20 * 12 + 0, 30, 2.0);
  // normalize to area 1 over the day in kWh units (per step area = val * dtH)
  let area = arr.reduce((s, v) => s + v * dtH, 0);
  return arr.map((v) => (area > 0 ? v / area : 0));
}

// PV bell-shape around midday; cloud randomness per prosumer
function pvProfile(kWp, cloud = 0.1) {
  const out = new Array(T).fill(0);
  const center = 12 * 12; // 12:00
  const width = 38; // spread ~ 3 hours
  for (let t = 0; t < T; t++) {
    const sun = Math.max(0, Math.exp(-((t - center) ** 2) / (2 * width ** 2)) - 0.08);
    const noise = 1 + (Math.random() * 2 - 1) * cloud; // simple cloudiness
    const kW = Math.max(0, kWp * sun * noise);
    out[t] = kW * dtH; // convert to kWh per step
  }
  return out;
}

// Time-of-use external prices in SLR/kWh
function externalPrices() {
  const buy = new Array(T).fill(0);
  const sell = new Array(T).fill(0);
  for (let t = 0; t < T; t++) {
    const hour = Math.floor((t * 5) / 60);
    let pb; // buy from grid (we pay)
    if (hour >= 17 && hour <= 21) pb = 0.28; // peak
    else if (hour >= 10 && hour <= 16) pb = 0.18; // day
    else pb = 0.12; // off-peak
    buy[t] = pb;
    sell[t] = Math.min(0.10, 0.6 * pb); // feed-in capped
  }
  return { buy, sell, mid: buy.map((v, i) => 0.5 * (v + sell[i])) };
}

// Build demand series from total daily kWh and shape
function demandSeries(totalKWh) {
  const shape = baseLoadShape();
  return shape.map((f) => f * totalKWh);
}

// Proportional matching of sellers to buyers each step
function simulate(dayDemandsKWh) {
  // Inputs
  const prices = externalPrices();
  const lambda = prices.mid; // internal settlement price

  // Build PV and load
  const PV = names.map((_, i) => pvProfile(PV_CAP[i], 0.08 + 0.03 * i)); // kWh per step
  const Load = names.map((_, i) => demandSeries(dayDemandsKWh[i])); // kWh per step

  // Wallets
  const walletStart = names.map(() => START_BAL);
  const wallet = [...walletStart];

  // Outputs to visualize
  const internalEnergy = new Array(T).fill(0);
  const extBuyEnergy = new Array(T).fill(0); // community import
  const extSellEnergy = new Array(T).fill(0); // community export
  const internalAmount = new Array(T).fill(0); // SLR/step
  const externalAmount = new Array(T).fill(0); // net SLR/step paid to grid (>0 cost, <0 revenue)

  // Ledger: list of transactions
  // {time,label,type:'internal'|'import'|'export', buyer, seller, energy, price, amount}
  const ledger = [];

  // Per-user tallies
  const user = names.map(() => ({
    pv: 0,
    load: 0,
    internal_buy: 0,
    internal_sell: 0,
    external_import: 0,
    external_export: 0,
    pay_internal: 0,
    earn_internal: 0,
    pay_external: 0,
    earn_external: 0,
  }));

  // Simulate stepwise
  for (let t = 0; t < T; t++) {
    // net for each user
    const net = names.map((_, i) => PV[i][t] - Load[i][t]);
    const sellers = [];
    const buyers = [];
    for (let i = 0; i < names.length; i++) {
      if (net[i] > 0) sellers.push({ i, e: net[i] });
      else if (net[i] < 0) buyers.push({ i, e: -net[i] });
      user[i].pv += PV[i][t];
      user[i].load += Load[i][t];
    }
    const S = sellers.reduce((s, a) => s + a.e, 0);
    const D = buyers.reduce((s, a) => s + a.e, 0);
    const matched = Math.min(S, D);
    internalEnergy[t] = matched;

    // allocate proportionally — and build pairwise internal trades ledger
    const sellersAlloc = sellers.map(s => ({ i: s.i, rem: S > 0 ? (s.e * matched) / S : 0 }));
    const buyersAlloc = buyers.map(b => ({ i: b.i, rem: D > 0 ? (b.e * matched) / D : 0 }));
    let si = 0, bi = 0;
    while (si < sellersAlloc.length && bi < buyersAlloc.length) {
      const s = sellersAlloc[si];
      const b = buyersAlloc[bi];
      const m = Math.min(s.rem, b.rem);
      if (m <= 1e-12) { if (s.rem <= 1e-12) si++; if (b.rem <= 1e-12) bi++; continue; }
      // record
      user[s.i].internal_sell += m;
      user[b.i].internal_buy += m;
      const amt = m * lambda[t];
      user[s.i].earn_internal += amt;
      user[b.i].pay_internal += amt;
      wallet[s.i] += amt;
      wallet[b.i] -= amt;
      ledger.push({
        time: t, label: timeLabels()[t], type: 'internal', buyer: names[b.i], seller: names[s.i], energy: m, price: lambda[t], amount: amt,
      });
      s.rem -= m; b.rem -= m;
      if (s.rem <= 1e-12) si++;
      if (b.rem <= 1e-12) bi++;
    }

    // residuals -> external
    // sellers export
    for (const s of sellers) {
      const internalShare = S > 0 ? (s.e * matched) / S : 0;
      const exportE = s.e - internalShare;
      if (exportE > 0) {
        user[s.i].external_export += exportE;
        const rev = exportE * prices.sell[t];
        user[s.i].earn_external += rev;
        wallet[s.i] += rev;
        extSellEnergy[t] += exportE;
      }
    }
    // buyers import
    for (const b of buyers) {
      const internalShare = D > 0 ? (b.e * matched) / D : 0;
      const importE = b.e - internalShare;
      if (importE > 0) {
        user[b.i].external_import += importE;
        const cost = importE * prices.buy[t];
        user[b.i].pay_external += cost;
        wallet[b.i] -= cost;
        extBuyEnergy[t] += importE;
        ledger.push({ time: t, label: timeLabels()[t], type: 'import', buyer: names[b.i], seller: 'GRID', energy: importE, price: prices.buy[t], amount: cost });
      }
    }

    internalAmount[t] = matched * lambda[t];
    externalAmount[t] = extBuyEnergy[t] * prices.buy[t] - extSellEnergy[t] * prices.sell[t];
  }

  const community = {
    internal_kWh: internalEnergy.reduce((s, v) => s + v, 0),
    import_kWh: extBuyEnergy.reduce((s, v) => s + v, 0),
    export_kWh: extSellEnergy.reduce((s, v) => s + v, 0),
    internal_amount: internalAmount.reduce((s, v) => s + v, 0),
    external_amount: externalAmount.reduce((s, v) => s + v, 0),
  };

  return {
    labels: timeLabels(),
    prices,
    internalEnergy,
    extBuyEnergy,
    extSellEnergy,
    internalAmount,
    externalAmount,
    walletStart,
    walletEnd: wallet,
    user,
    community,
    ledger,
  };
}

function fmt(v, n = 2) { return Number(v).toFixed(n); }

// Renderers
function renderCommunitySummary(r) {
  const ul = document.getElementById("summaryCommunity");
  ul.innerHTML = `
    <li>Internal energy matched: <strong>${fmt(r.community.internal_kWh)}</strong> kWh</li>
    <li>External import: <strong>${fmt(r.community.import_kWh)}</strong> kWh</li>
    <li>External export: <strong>${fmt(r.community.export_kWh)}</strong> kWh</li>
    <li>Internal amount: <strong>${fmt(r.community.internal_amount)}</strong> SLR</li>
    <li>External net amount: <strong>${fmt(r.community.external_amount)}</strong> SLR</li>
  `;
}

function renderP1Summary(r) {
  const p1 = r.user[0];
  const ul = document.getElementById("summaryP1");
  const delta = r.walletEnd[0] - r.walletStart[0];
  ul.innerHTML = `
    <li>PV generation: <strong>${fmt(p1.pv)}</strong> kWh</li>
    <li>Load: <strong>${fmt(p1.load)}</strong> kWh</li>
    <li>Internal buy/sell: <strong>${fmt(p1.internal_buy)}</strong> / <strong>${fmt(p1.internal_sell)}</strong> kWh</li>
    <li>External import/export: <strong>${fmt(p1.external_import)}</strong> / <strong>${fmt(p1.external_export)}</strong> kWh</li>
    <li>Spend/Earn internal: <strong>${fmt(p1.pay_internal)}</strong> / <strong>${fmt(p1.earn_internal)}</strong> SLR</li>
    <li>Spend/Earn external: <strong>${fmt(p1.pay_external)}</strong> / <strong>${fmt(p1.earn_external)}</strong> SLR</li>
    <li>Wallet start/end: <strong>${fmt(r.walletStart[0])}</strong> → <strong>${fmt(r.walletEnd[0])}</strong> SLR (<span style="color:${delta>=0?'#63d297':'#ff7cb5'}">${delta>=0?'+':''}${fmt(delta)}</span>)</li>
  `;
}

function makeOrUpdateChart(ref, ctx, cfg) {
  if (ref && ref.destroy) ref.destroy();
  return new Chart(ctx, cfg);
}

function renderCharts(r) {
  // Energy chart
  energyChart = makeOrUpdateChart(
    energyChart,
    document.getElementById("energyChart"),
    {
      type: "line",
      data: {
        labels: r.labels,
        datasets: [
          { label: "Internal trade (kWh)", data: r.internalEnergy, borderColor: "#7c8cff", backgroundColor: "rgba(124,140,255,0.2)", tension: 0.25, pointRadius: 0 },
          { label: "External import (kWh)", data: r.extBuyEnergy, borderColor: "#ff7cb5", backgroundColor: "rgba(255,124,181,0.2)", tension: 0.25, pointRadius: 0 },
          { label: "External export (kWh)", data: r.extSellEnergy.map(v=>-v), borderColor: "#63d297", backgroundColor: "rgba(99,210,151,0.2)", tension: 0.25, pointRadius: 0 },
        ],
      },
      options: { responsive: true, scales: { y: { title: { text: "kWh/step", display: true } } }, plugins: { legend: { display: true } } },
    }
  );

  // Amount chart
  amountChart = makeOrUpdateChart(
    amountChart,
    document.getElementById("amountChart"),
    {
      type: "line",
      data: {
        labels: r.labels,
        datasets: [
          { label: "Internal amount (SLR)", data: r.internalAmount, borderColor: "#7c8cff", backgroundColor: "rgba(124,140,255,0.2)", tension: 0.25, pointRadius: 0 },
          { label: "External net (SLR)", data: r.externalAmount, borderColor: "#ffcc66", backgroundColor: "rgba(255,204,102,0.2)", tension: 0.25, pointRadius: 0 },
        ],
      },
      options: { responsive: true, scales: { y: { title: { text: "SLR/step", display: true } } }, plugins: { legend: { display: true } } },
    }
  );

  // Donut: external import vs export
  donutChart = makeOrUpdateChart(
    donutChart,
    document.getElementById("donutChart"),
    {
      type: "doughnut",
      data: {
        labels: ["External import", "External export"],
        datasets: [{ data: [r.community.import_kWh, r.community.export_kWh], backgroundColor: ["#ff7cb5", "#7cc0ff"], borderWidth: 0 }],
      },
      options: { plugins: { legend: { position: "bottom" } } },
    }
  );

  // Balances bar
  balanceChart = makeOrUpdateChart(
    balanceChart,
    document.getElementById("balanceChart"),
    {
      type: "bar",
      data: {
        labels: names,
        datasets: [{ label: "SolarCoin", data: r.walletEnd, backgroundColor: "#ffc04d", borderColor: "#e3a93f" }],
      },
      options: { indexAxis: "x", scales: { y: { beginAtZero: true } }, plugins: { legend: { position: "top" } } },
    }
  );
}

function downloadCSV(r) {
  const rows = [
    ["time", "internal_kWh", "ext_import_kWh", "ext_export_kWh", "internal_amount_SLR", "external_net_SLR"],
  ];
  for (let t = 0; t < T; t++) {
    rows.push([
      r.labels[t],
      fmt(r.internalEnergy[t]),
      fmt(r.extBuyEnergy[t]),
      fmt(r.extSellEnergy[t]),
      fmt(r.internalAmount[t]),
      fmt(r.externalAmount[t]),
    ]);
  }
  const csv = rows.map((a) => a.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "solarcoin_settlements_sim.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function run() {
  const demandP1 = parseFloat(document.getElementById("demandInput").value || "20");
  const dayDemands = [...DEFAULT_DEMANDS];
  dayDemands[0] = demandP1;
  const r = simulate(dayDemands);
  // persist ledger for the ledger page
  try { localStorage.setItem('solarcoin_ledger', JSON.stringify(r.ledger)); } catch {}
  renderCommunitySummary(r);
  renderP1Summary(r);
  renderCharts(r);
  return r;
}

let lastRun = null;
window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("runBtn").addEventListener("click", () => {
    lastRun = run();
  });
  document.getElementById("downloadCsvBtn").addEventListener("click", () => {
    lastRun && downloadCSV(lastRun);
  });
  document.getElementById("openLedgerBtn").addEventListener("click", () => {
    window.open('ledger.html', '_blank');
  });
  lastRun = run();
  // Wallet overlay logic
  const overlay = document.getElementById('connectOverlay');
  const showOverlay = () => overlay.classList.remove('hidden');
  const hideOverlay = () => overlay.classList.add('hidden');
  document.getElementById('overlayConnect').addEventListener('click', async () => {
    const ctx = await connectMetaMask();
    if (ctx) {
      hideOverlay();
      try { localStorage.setItem('solarcoin_wallet_seen', '1'); } catch {}
    }
  });
  document.getElementById('overlaySkip').addEventListener('click', hideOverlay);

  // Try silent connect; if not connected and first visit, show overlay
  (async () => {
    if (!window.ethereum) return; // no wallet
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accts = await provider.send('eth_accounts', []);
      if (accts && accts.length > 0) {
        const signer = await provider.getSigner();
        const net = await provider.getNetwork();
        setWalletUI({ ok: true, account: accts[0], chainId: Number(net.chainId) });
        try { localStorage.setItem('solarcoin_wallet_seen', '1'); } catch {}
      } else {
        const seen = localStorage.getItem('solarcoin_wallet_seen');
        if (!seen) showOverlay();
      }
    } catch {
      // ignore
    }
  })();

  // React to MetaMask changes
  if (window.ethereum) {
    window.ethereum.on?.('accountsChanged', async (accs) => {
      if (accs && accs.length) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const net = await provider.getNetwork();
        setWalletUI({ ok: true, account: accs[0], chainId: Number(net.chainId) });
      } else {
        setWalletUI({ ok: false, message: 'Disconnected' });
      }
    });
    window.ethereum.on?.('chainChanged', async () => {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accts = await provider.send('eth_accounts', []);
      if (accts && accts.length) {
        const net = await provider.getNetwork();
        setWalletUI({ ok: true, account: accts[0], chainId: Number(net.chainId) });
      }
    });
  }
});

// ---------------------- MetaMask / Ethers demo ----------------------
function setWalletUI({ account, chainId, ok, message }) {
  const info = document.getElementById('walletInfo');
  const badge = document.getElementById('walletBadge');
  if (ok) {
    badge.textContent = 'Connected to MetaMask';
    badge.classList.remove('hidden');
    badge.classList.add('ok');
    badge.classList.remove('err');
    info.textContent = `Connected: ${account} | chainId ${chainId}`;
  } else {
    badge.textContent = 'Not connected';
    badge.classList.remove('ok');
    badge.classList.add('err');
    badge.classList.remove('hidden');
    info.textContent = message || 'Not connected';
  }
}

async function connectMetaMask() {
  if (!window.ethereum) {
    setWalletUI({ ok: false, message: 'MetaMask not detected' });
    return null;
  }
  const provider = new ethers.BrowserProvider(window.ethereum);
  const accounts = await provider.send('eth_requestAccounts', []); // prompts MetaMask
  const signer = await provider.getSigner();
  const net = await provider.getNetwork();
  setWalletUI({ ok: true, account: accounts[0], chainId: Number(net.chainId) });
  return { provider, signer };
}


function erc20Contract(providerOrSigner, address) {
  const abi = [
    'function balanceOf(address) view returns (uint256)',
    'function allowance(address owner, address spender) view returns (uint256)',
    'function approve(address spender, uint256 value) returns (bool)',
    'function transfer(address to, uint256 value) returns (bool)',
    'function decimals() view returns (uint8)',
    'event Transfer(address indexed from, address indexed to, uint256 value)'
  ];
  return new ethers.Contract(address, abi, providerOrSigner);
}

let cachedSigner = null;
document.getElementById('connectBtn').addEventListener('click', async () => {
  const ctx = await connectMetaMask();
  cachedSigner = ctx ? ctx.signer : null;
});

// Guarded: Advanced ERC-20 handlers exist only if advanced UI is present
const approveBtnEl = document.getElementById('approveBtn');
if (approveBtnEl) approveBtnEl.addEventListener('click', async () => {
  try {
    if (!cachedSigner) { document.getElementById('approveMsg').textContent = 'Connect wallet first'; return; }
    const tokenAddr = document.getElementById('tokenAddr').value.trim();
    const spender = document.getElementById('settleAddr').value.trim();
    const amt = parseFloat(document.getElementById('approveAmt').value || '0');
    if (!ethers.isAddress(tokenAddr) || !ethers.isAddress(spender) || !(amt > 0)) { document.getElementById('approveMsg').textContent = 'Invalid inputs'; return; }
    const c = erc20Contract(cachedSigner, tokenAddr);
    const decimals = await c.decimals().catch(() => 18);
    const value = ethers.parseUnits(String(amt), decimals);
    const tx = await c.approve(spender, value);
    document.getElementById('approveMsg').textContent = `Tx sent: ${tx.hash.slice(0,10)}…`;
    await tx.wait();
    document.getElementById('approveMsg').textContent = 'Approved (confirmed)';
  } catch (e) {
    document.getElementById('approveMsg').textContent = e?.message?.slice(0,120) || String(e);
  }
});

const transferBtnEl = document.getElementById('transferBtn');
if (transferBtnEl) transferBtnEl.addEventListener('click', async () => {
  try {
    if (!cachedSigner) { document.getElementById('transferMsg').textContent = 'Connect wallet first'; return; }
    const tokenAddr = document.getElementById('tokenAddr').value.trim();
    const to = document.getElementById('transferTo').value.trim();
    const amt = parseFloat(document.getElementById('transferAmt').value || '0');
    if (!ethers.isAddress(tokenAddr) || !ethers.isAddress(to) || !(amt > 0)) { document.getElementById('transferMsg').textContent = 'Invalid inputs'; return; }
    const c = erc20Contract(cachedSigner, tokenAddr);
    const decimals = await c.decimals().catch(() => 18);
    const value = ethers.parseUnits(String(amt), decimals);
    const tx = await c.transfer(to, value);
    document.getElementById('transferMsg').textContent = `Tx sent: ${tx.hash.slice(0,10)}…`;
    await tx.wait();
    document.getElementById('transferMsg').textContent = 'Transfer confirmed';
  } catch (e) {
    document.getElementById('transferMsg').textContent = e?.message?.slice(0,120) || String(e);
  }
});
