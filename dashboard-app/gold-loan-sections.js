/* ═══════════════════════════════════════════════════════
   GOLD LOAN SECTIONS — Part 5 of 8
   New Customers | Closed Loans | High Risk
   Globals: D, period, HIGH_RISK_ACCOUNTS, GOLDRATE
═══════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────────────────
   1. NEW CUSTOMERS
───────────────────────────────────────────────────── */
function renderNewCustomers() {
  const nc = D[period].newCust;

  /* KPI cards */
  const kpiEl = document.getElementById('newCustKpis');
  if (kpiEl) {
    const pct = n => nc.total > 0 ? Math.round(n / nc.total * 100) : 0;
    const cards = [
      { lbl: 'Total new customers', val: nc.total,    cls: 'up',  sub: '100% of new acquisitions' },
      { lbl: 'Walk-in',             val: nc.walkin,   cls: '',    sub: pct(nc.walkin)  + '% of new' },
      { lbl: 'Referral',            val: nc.referral, cls: 'up',  sub: pct(nc.referral) + '% of new' },
      { lbl: 'Digital / online',    val: nc.digital,  cls: 'neu', sub: pct(nc.digital)  + '% of new' }
    ];
    kpiEl.innerHTML = `<div class="nc-grid">${
      cards.map(c => `<div class="nc-kpi">
        <div class="nk-lbl">${c.lbl}</div>
        <div class="nk-val ${c.cls}">${c.val}</div>
        <div class="nk-sub ${c.cls}">${c.sub}</div>
      </div>`).join('')
    }</div>`;
  }

  /* Branch table */
  const tblEl = document.getElementById('newCustBranchTbl');
  if (tblEl) {
    const rows = nc.byBranch.filter(b => !(b.new === 0 && b.loans === 0));
    const totNew   = rows.reduce((s, b) => s + b.new,   0);
    const totLoans = rows.reduce((s, b) => s + b.loans, 0);
    const totGrams = rows.reduce((s, b) => s + b.grams, 0);
    const totAvg   = totLoans > 0 ? Math.round(totGrams / totLoans * 10) / 10 : 0;

    tblEl.innerHTML = `<table class="btable">
      <thead><tr>
        <th>Branch</th>
        <th style="text-align:right;">New Customers</th>
        <th style="text-align:right;">New Loans</th>
        <th style="text-align:right;">Grams Pledged</th>
        <th style="text-align:right;">Avg g/Loan</th>
      </tr></thead>
      <tbody>
        ${rows.map(b => {
          const avg = b.loans > 0 ? Math.round(b.grams / b.loans * 10) / 10 : 0;
          return `<tr>
            <td>${b.n}</td>
            <td style="text-align:right;">${b.new}</td>
            <td style="text-align:right;">${b.loans}</td>
            <td style="text-align:right;">${b.grams.toLocaleString()}g</td>
            <td style="text-align:right;">${avg}g</td>
          </tr>`;
        }).join('')}
        <tr class="tot">
          <td>Total</td>
          <td style="text-align:right;">${totNew}</td>
          <td style="text-align:right;">${totLoans}</td>
          <td style="text-align:right;">${totGrams.toLocaleString()}g</td>
          <td style="text-align:right;">${totAvg}g</td>
        </tr>
      </tbody>
    </table>`;
  }
}

/* ─────────────────────────────────────────────────────
   2. CLOSED LOANS
───────────────────────────────────────────────────── */
function renderClosedLoans() {
  const cl = D[period].closure;

  /* 2×2 KPI cards */
  const kpiEl = document.getElementById('closureKpis');
  if (kpiEl) {
    kpiEl.innerHTML = `<div class="nc-grid" style="grid-template-columns:repeat(2,1fr);">
      <div class="nc-kpi">
        <div class="nk-lbl">Loans closed</div>
        <div class="nk-val">${cl.loans.toLocaleString()}</div>
        <div class="nk-sub neu">accounts settled</div>
      </div>
      <div class="nc-kpi">
        <div class="nk-lbl">Gold released</div>
        <div class="nk-val up">${cl.grams.toLocaleString()}g</div>
        <div class="nk-sub up">grams returned</div>
      </div>
      <div class="nc-kpi">
        <div class="nk-lbl">Value released</div>
        <div class="nk-val">${cl.value}</div>
        <div class="nk-sub neu">collateral returned</div>
      </div>
      <div class="nc-kpi">
        <div class="nk-lbl">Avg grams / closure</div>
        <div class="nk-val">${cl.avgGrams}g</div>
        <div class="nk-sub neu">per closed loan</div>
      </div>
    </div>`;
  }

  /* By-branch bar rows */
  const branchEl = document.getElementById('closureByBranch');
  if (branchEl) {
    const max = Math.max(...cl.byBranch.map(b => b.grams));
    branchEl.innerHTML = cl.byBranch.map(b => {
      const w = max > 0 ? Math.round(b.grams / max * 100) : 0;
      return `<div class="cgl-row">
        <div class="cgl-label">${b.n}</div>
        <div class="cgl-bar-wrap">
          <div class="cgl-bar" style="width:${w}%;background:#1D9E75;"></div>
        </div>
        <div class="cgl-val">${b.grams.toLocaleString()}g</div>
      </div>`;
    }).join('');
  }

  /* Closure reason bars */
  const reasonEl = document.getElementById('closureReasons');
  if (reasonEl) {
    const maxR = Math.max(...cl.reasons.map(r => r.pct));
    reasonEl.innerHTML = cl.reasons.map(r => {
      const w = maxR > 0 ? Math.round(r.pct / maxR * 100) : 0;
      return `<div class="cgl-row">
        <div class="cgl-label" style="width:120px;">${r.r}</div>
        <div class="cgl-bar-wrap">
          <div class="cgl-bar" style="width:${w}%;background:#185FA5;"></div>
        </div>
        <div class="cgl-val">${r.pct}%</div>
      </div>`;
    }).join('');
  }
}

/* ─────────────────────────────────────────────────────
   3. HIGH RISK ACCOUNTS
───────────────────────────────────────────────────── */
function renderHighRisk() {
  const critical = HIGH_RISK_ACCOUNTS.filter(r => r.status === 'critical');
  const high     = HIGH_RISK_ACCOUNTS.filter(r => r.status === 'high');
  const watch    = HIGH_RISK_ACCOUNTS.filter(r => r.status === 'watch');

  const totalShortfall = HIGH_RISK_ACCOUNTS.reduce((s, r) => {
    const diff = r.outstanding - r.goldValue;
    return s + (diff > 0 ? diff : 0);
  }, 0);

  /* Gold rate display */
  const rateEl = document.getElementById('goldRateDisplay');
  if (rateEl) rateEl.textContent = GOLDRATE.toLocaleString();

  /* Risk summary grid */
  const summaryEl = document.getElementById('riskSummary');
  if (summaryEl) {
    summaryEl.innerHTML = `
      <div class="risk-stat">
        <div class="rs-num" style="color:#D85A30;">${critical.length}</div>
        <div class="rs-lbl">Critical &gt;15% shortfall</div>
      </div>
      <div class="risk-stat">
        <div class="rs-num" style="color:#BA7517;">${high.length}</div>
        <div class="rs-lbl">High risk 5–15% shortfall</div>
      </div>
      <div class="risk-stat">
        <div class="rs-num" style="color:#185FA5;">${watch.length}</div>
        <div class="rs-lbl">Watch 0–5% shortfall</div>
      </div>`;
  }

  /* High risk table */
  const tblEl = document.getElementById('highRiskTbl');
  if (!tblEl) return;

  const rows = HIGH_RISK_ACCOUNTS.map(r => {
    const shortfall    = r.outstanding - r.goldValue;
    const shortfallPct = r.goldValue > 0 ? Math.round(shortfall / r.goldValue * 100) : 0;
    const odColor      = r.daysOverdue > 60 ? '#D85A30' : r.daysOverdue > 30 ? '#EF9F27' : '#888780';
    const badgeCls     = r.status === 'critical' ? 'hr-critical'
                       : r.status === 'high'     ? 'hr-high'
                       : 'hr-watch';
    const badgeLabel   = r.status === 'critical' ? 'Critical'
                       : r.status === 'high'     ? 'High'
                       : 'Watch';

    return `<tr>
      <td>${r.id}</td>
      <td>${r.branch}</td>
      <td>${r.customer}</td>
      <td style="text-align:right;">${r.grams}g</td>
      <td style="text-align:right;">₹${r.goldValue.toLocaleString()}</td>
      <td style="text-align:right;color:#D85A30;font-weight:500;">₹${r.outstanding.toLocaleString()}</td>
      <td style="text-align:right;">
        <span style="color:#D85A30;font-weight:500;">₹${shortfall > 0 ? shortfall.toLocaleString() : 0}</span>
        <span style="color:var(--color-text-tertiary);font-size:10px;display:block;">${shortfall > 0 ? shortfallPct + '%' : '—'}</span>
      </td>
      <td style="text-align:right;color:${odColor};">${r.daysOverdue}d</td>
      <td><span class="hr-badge ${badgeCls}">${badgeLabel}</span></td>
    </tr>`;
  }).join('');

  const totalOutstanding = HIGH_RISK_ACCOUNTS.reduce((s, r) => s + r.outstanding, 0);

  tblEl.innerHTML = `<table class="btable">
    <thead><tr>
      <th>Loan ID</th>
      <th>Branch</th>
      <th>Customer</th>
      <th style="text-align:right;">Grams</th>
      <th style="text-align:right;">Gold Value @₹${GOLDRATE.toLocaleString()}/g</th>
      <th style="text-align:right;">Outstanding</th>
      <th style="text-align:right;">Shortfall</th>
      <th style="text-align:right;">Overdue Days</th>
      <th>Risk Level</th>
    </tr></thead>
    <tbody>
      ${rows}
      <tr class="tot">
        <td colspan="5">Total exposure at risk</td>
        <td colspan="2" style="text-align:right;color:#D85A30;font-weight:500;">
          ₹${totalShortfall.toLocaleString()} shortfall
        </td>
        <td colspan="2" style="text-align:right;">
          ${HIGH_RISK_ACCOUNTS.length} accounts
        </td>
      </tr>
    </tbody>
  </table>`;
}
