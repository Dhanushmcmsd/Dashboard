/* ═══════════════════════════════════════════════════════
   GOLD LOAN RENDER — Part 3 of 8
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
    const unit   = period === 'YTD' ? ' Cr' : ' Cr';

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
