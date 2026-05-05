/* ═══════════════════════════════════════════════════════
   GOLD LOAN RENDER — Part 3 of 8 (extended in Part 6)
   KPI + Period + Layout Render Functions
   Globals: D, period, GOLDRATE, HIGH_RISK_ACCOUNTS, BRANCHES
═══════════════════════════════════════════════════════ */

let period = 'MTD';

/* ── Period switcher ── */
function setP(p, btn) {
  period = p;
  const dash = document.querySelector('.dash');
  dash.classList.add('period-fade');
  setTimeout(() => dash.classList.remove('period-fade'), 200);
  document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderAll();
}

/* ── Master render ── */
function renderAll() {
  renderKPIs();
  renderCollOverview();
  renderBuckets();
  renderTgtBars();
  renderLTV();
  renderBranchTable();
  renderAlerts();
  renderCharts();
  renderNewCustomers();
  renderClosedLoans();
  renderHighRisk();
}

/* ─────────────────────────────────────────────────────
   1. KPI CARDS
───────────────────────────────────────────────────── */
function renderKPIs() {
  const el = document.getElementById('kpis');
  if (!el) return;
  el.innerHTML = D[period].kpis.map(k => {
    const subCls = k.d === 'up' ? 'up' : k.d === 'dn' ? 'dn' : 'neu';
    return `<div class="kpi">
      <div class="lbl">${k.l}</div>
      <div class="num">${k.v}</div>
      <div class="sub ${subCls}">${k.s}</div>
    </div>`;
  }).join('');
  animateCountUp();
}

/* ─────────────────────────────────────────────────────
   2. COUNT-UP ANIMATION
───────────────────────────────────────────────────── */
function animateCountUp() {
  document.querySelectorAll('.num').forEach(el => {
    const original = el.textContent.trim();

    // Extract numeric value — strip ₹, Cr, %, g, commas, spaces
    const match = original.match(/[\d,\.]+/);
    if (!match) return;
    const raw = parseFloat(match[0].replace(/,/g, ''));
    if (isNaN(raw) || raw === 0) return;

    // Identify prefix and suffix to reconstruct after animation
    const numStr = match[0];
    const idx    = original.indexOf(numStr);
    const prefix = original.slice(0, idx);
    const suffix = original.slice(idx + numStr.length);

    // Determine decimal places from original
    const decimalMatch = numStr.match(/\.(\d+)/);
    const decimals = decimalMatch ? decimalMatch[1].length : 0;

    const duration = 600;
    const start    = performance.now();
    const ease     = t => 1 - Math.pow(1 - t, 3);

    function frame(now) {
      const elapsed = now - start;
      const t       = Math.min(elapsed / duration, 1);
      const current = raw * ease(t);

      // Format with commas if original had them
      const hasComma = numStr.includes(',');
      let formatted;
      if (hasComma) {
        formatted = current.toFixed(decimals)
          .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      } else {
        formatted = current.toFixed(decimals);
      }

      el.textContent = prefix + formatted + suffix;

      if (t < 1) requestAnimationFrame(frame);
      else el.textContent = original; // restore exact original on finish
    }

    requestAnimationFrame(frame);
  });
}

/* ─────────────────────────────────────────────────────
   3. COLLECTION OVERVIEW
───────────────────────────────────────────────────── */
function renderCollOverview() {
  const el = document.getElementById('collOverview');
  if (!el) return;
  const items = D[period].collOverview;
  el.innerHTML = items.map((item, i) => {
    const isLast   = i === items.length - 1;
    const valCls   = item.c === 'up' ? 'up' : item.c === 'dn' ? 'dn' : '';
    const border   = isLast ? '' : 'border-bottom:0.5px solid var(--color-border-tertiary);';
    return `<div style="display:flex;justify-content:space-between;align-items:center;
                        padding:6px 0;${border}font-size:12px;">
      <span style="color:var(--color-text-secondary);">${item.l}</span>
      <span style="color:var(--color-text-primary);font-weight:500;" class="${valCls}">${item.v}</span>
    </div>`;
  }).join('');
}

/* ─────────────────────────────────────────────────────
   4. OVERDUE BUCKETS TABLE
───────────────────────────────────────────────────── */
function renderBuckets() {
  const el = document.getElementById('bucketTbl');
  if (!el) return;
  const { buckets, totalOD } = D[period];

  const rows = buckets.map(b => {
    const color = b.pct > 30 ? '#D85A30' : b.pct > 20 ? '#EF9F27' : '#1D9E75';
    const bar = `<div class="pb" style="width:80px;display:inline-block;vertical-align:middle;margin-left:6px;">
      <div class="pf" style="width:${b.pct}%;background:${color};"></div>
    </div>`;
    return `<tr>
      <td>${b.b}</td>
      <td style="text-align:right;">${b.amt}</td>
      <td style="text-align:right;">${b.pct}%${bar}</td>
      <td style="text-align:center;color:${b.trend === '↑' ? '#D85A30' : b.trend === '↓' ? '#1D9E75' : 'var(--color-text-secondary)'};
          font-size:14px;">${b.trend || '—'}</td>
    </tr>`;
  }).join('');

  el.innerHTML = `<table class="btable">
    <thead>
      <tr>
        <th>Bucket</th>
        <th style="text-align:right;">OD Amount</th>
        <th style="text-align:right;">% of Total OD</th>
        <th style="text-align:center;">Trend</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
      <tr class="tot">
        <td colspan="1">Total overdue</td>
        <td style="text-align:right;">${totalOD} Cr</td>
        <td></td><td></td>
      </tr>
    </tbody>
  </table>`;
}

/* ─────────────────────────────────────────────────────
   5. BRANCH TARGET BARS
───────────────────────────────────────────────────── */
function renderTgtBars() {
  const el = document.getElementById('tgtBars');
  if (!el) return;
  const branches = D[period].tgtBranches;
  const max = Math.max(...branches.map(b => b.tgt));

  el.innerHTML = branches.map(b => {
    const actPct = Math.round(b.act / max * 100);
    const tgtPct = Math.round(b.tgt / max * 100);
    const achPct = Math.round(b.act / b.tgt * 100);
    const color  = achPct >= 95 ? '#1D9E75' : achPct >= 80 ? '#EF9F27' : '#D85A30';
    const unit   = ' Cr';

    return `<div class="tgt-row">
      <div class="tgt-name">${b.n}</div>
      <div class="tgt-bar-wrap">
        <div class="tgt-bar" style="width:${actPct}%;background:${color};"></div>
        <div class="tgt-marker" style="left:${tgtPct}%;"></div>
      </div>
      <div class="tgt-pct" style="color:${color};">${achPct}%</div>
      <div class="tgt-val">${b.act}${unit}</div>
    </div>`;
  }).join('');
}

/* ─────────────────────────────────────────────────────
   6. LTV / GOLD METRICS
───────────────────────────────────────────────────── */
function renderLTV() {
  const el = document.getElementById('ltvSection');
  if (!el) return;

  const items = [
    {l:'Avg LTV',             v:'62.4%',      f:62,  c:'#185FA5'},
    {l:'Gold price / gram',   v:'₹9,240',      f:75,  c:'#BA7517'},
    {l:'Avg loan / gram',     v:'₹5,765',      f:62,  c:'#1D9E75'},
    {l:'High LTV >75% cases', v:'14 loans',    f:14,  c:'#D85A30'},
    {l:'Auction cases',       v:'3 cases',     f:3,   c:'#993C1D'},
    {l:'Total gold pledged',  v:'2,31,800 g',  f:65,  c:'#185FA5'}
  ];

  el.innerHTML = items.map(item => {
    const w = Math.min(item.f, 100);
    return `<div style="margin-bottom:10px;">
      <div style="display:flex;justify-content:space-between;align-items:center;
                  font-size:12px;margin-bottom:4px;">
        <span style="color:var(--color-text-secondary);">${item.l}</span>
        <span style="color:var(--color-text-primary);font-weight:500;">${item.v}</span>
      </div>
      <div class="pb">
        <div class="pf" style="width:${w}%;background:${item.c};"></div>
      </div>
    </div>`;
  }).join('');
}

/* ─────────────────────────────────────────────────────
   7. BRANCH TABLE  (Part 6)
───────────────────────────────────────────────────── */
function renderBranchTable() {
  const el = document.getElementById('branchTbl');
  if (!el) return;

  const rows = BRANCHES.map(b => {
    const loans    = Math.round(b.aum * 100 / 5.24);
    const avgGw    = Math.round(b.gw / loans * 10) / 10;
    const collColor = b.coll < 98 ? '#D85A30' : b.coll < 99 ? '#EF9F27' : '#1D9E75';
    const npaColor  = b.npa > 2.5 ? '#D85A30' : b.npa > 2   ? '#BA7517' : '#1D9E75';

    return `<tr>
      <td>${b.n}</td>
      <td style="text-align:right;">${b.aum}</td>
      <td style="text-align:right;">${b.disb}</td>
      <td style="text-align:right;color:${collColor};font-weight:500;">${b.coll}%</td>
      <td style="text-align:right;color:${npaColor};font-weight:500;">${b.npa}%</td>
      <td style="text-align:right;">${b.gw.toLocaleString()}</td>
      <td style="text-align:right;">${avgGw}g</td>
    </tr>`;
  }).join('');

  el.innerHTML = `<table class="btable">
    <thead>
      <tr>
        <th>Branch</th>
        <th style="text-align:right;">AUM (₹Cr)</th>
        <th style="text-align:right;">Disbursement (₹Cr)</th>
        <th style="text-align:right;">Coll. Eff. %</th>
        <th style="text-align:right;">NPA %</th>
        <th style="text-align:right;">Gold Wt (g)</th>
        <th style="text-align:right;">Avg Gold Wt/Loan</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>`;
}

/* ─────────────────────────────────────────────────────
   8. ALERTS  (Part 6)
───────────────────────────────────────────────────── */
function renderAlerts() {
  const el = document.getElementById('alerts');
  if (!el) return;

  const critical = HIGH_RISK_ACCOUNTS.filter(r => r.status === 'critical').length;

  const alerts = [
    {t:'d', m:'Kottayam NPA at 3.1% exceeds 3% threshold. Immediate review required.'},
    {t:'w', m:'4 high-value disbursements >₹10L pending second-level approval.'},
    {t:'w', m:'14 loans above 75% LTV following gold price movement. Revaluation due.'},
    {t:'d', m:'3 accounts gold valuation mismatch flagged — audit initiated.'},
    {t:'i', m:'MTD disbursement at 89% of target. ' + (period === 'MTD' ? 'Month end — 3 business days action needed.' : 'Review disbursement pace.')},
    {t:'w', m:'Trivandrum & Kottayam collection efficiency below 98%. Escalation triggered.'},
    {t:'i', m:'Overdue collection ₹1.86 Cr MTD — 148 accounts, 14% in 90+ bucket.'},
    {t:'d', m: critical + ' accounts loan outstanding exceeds current gold collateral value. Immediate notice required.'}
  ];

  el.innerHTML = alerts.map((a, i) =>
    `<div class="al ${a.t}" style="animation-delay:${i * 60}ms">
      <div class="dot"></div>
      <span>${a.m}</span>
    </div>`
  ).join('');
}
