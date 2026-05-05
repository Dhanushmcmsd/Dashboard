/* ═══════════════════════════════════════════════════════
   GOLD LOAN CHARTS — Part 4 of 8
   Chart.js 4.4.1 — globals: D, period, Chart
═══════════════════════════════════════════════════════ */

let charts = {};

function mkChart(id, cfg) {
  if (charts[id]) charts[id].destroy();
  const canvas = document.getElementById(id);
  if (!canvas) return;
  charts[id] = new Chart(canvas, cfg);
}

/* ── Shared scale defaults ── */
const _xNoGrid = {
  grid: { display: false },
  ticks: { font: { size: 10 }, color: '#8e8e99' }
};
const _yGrid = {
  grid: { color: 'rgba(128,128,128,0.1)' },
  ticks: { font: { size: 10 }, color: '#8e8e99' }
};
const _noLegend   = { legend: { display: false } };
const _responsive = { responsive: true, maintainAspectRatio: false };

function renderCharts() {

  /* ───────────────────────────────────────────────────
     1. Daily Disbursement — Line
  ─────────────────────────────────────────────────── */
  mkChart('cDailyDisb', {
    type: 'line',
    data: {
      labels: D[period].dailyDisb.labels,
      datasets: [{
        label: 'Daily disb ₹Cr',
        data: D[period].dailyDisb.data,
        borderColor: '#378ADD',
        backgroundColor: 'rgba(55,138,221,0.08)',
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: '#378ADD',
        fill: true,
        tension: 0.35
      }]
    },
    options: {
      ..._responsive,
      plugins: _noLegend,
      scales: {
        x: {
          ..._xNoGrid,
          ticks: { font: { size: 10 }, color: '#8e8e99' }
        },
        y: {
          ..._yGrid,
          ticks: {
            font: { size: 10 },
            color: '#8e8e99',
            callback: v => v + 'Cr'
          }
        }
      }
    }
  });

  /* ───────────────────────────────────────────────────
     2. Disbursement vs Collection — Grouped Bar
  ─────────────────────────────────────────────────── */
  mkChart('cDisbColl', {
    type: 'bar',
    data: {
      labels: D[period].disbColl.labels,
      datasets: [
        {
          label: 'Disbursement',
          data: D[period].disbColl.disb,
          backgroundColor: '#378ADD',
          borderRadius: 3,
          barPercentage: 0.4
        },
        {
          label: 'Collection',
          data: D[period].disbColl.coll,
          backgroundColor: '#1D9E75',
          borderRadius: 3,
          barPercentage: 0.4
        }
      ]
    },
    options: {
      ..._responsive,
      plugins: _noLegend,
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            font: { size: 10 },
            color: '#8e8e99',
            autoSkip: false,
            maxRotation: 45
          }
        },
        y: {
          ..._yGrid,
          ticks: {
            font: { size: 10 },
            color: '#8e8e99',
            callback: v => v + 'Cr'
          }
        }
      }
    }
  });

  /* ───────────────────────────────────────────────────
     3. NPA Buckets — Horizontal Bar
  ─────────────────────────────────────────────────── */
  mkChart('cNpa', {
    type: 'bar',
    data: {
      labels: ['SMA-0', 'SMA-1', 'SMA-2', 'GNPA', 'NNPA'],
      datasets: [{
        data: [3.2, 1.4, 0.6, 1.82, 1.24],
        backgroundColor: ['#85B7EB', '#EF9F27', '#F0997B', '#E24B4A', '#A32D2D'],
        borderRadius: 3
      }]
    },
    options: {
      ..._responsive,
      indexAxis: 'y',
      plugins: _noLegend,
      scales: {
        x: {
          grid: { color: 'rgba(128,128,128,0.1)' },
          ticks: {
            font: { size: 10 },
            color: '#8e8e99',
            callback: v => v + '%'
          }
        },
        y: {
          grid: { display: false },
          ticks: { font: { size: 10 }, color: '#8e8e99' }
        }
      }
    }
  });

  /* ───────────────────────────────────────────────────
     4. AUM by Scheme — Doughnut
  ─────────────────────═──────────────────────────── */
  mkChart('cAum', {
    type: 'doughnut',
    data: {
      labels: ['Bullet', 'OD', 'Agri', 'Agri-J', 'Others'],
      datasets: [{
        data: [42, 28, 15, 10, 5],
        backgroundColor: ['#185FA5', '#1D9E75', '#BA7517', '#993C1D', '#888780'],
        borderWidth: 0,
        hoverOffset: 4
      }]
    },
    options: {
      ..._responsive,
      cutout: '62%',
      plugins: _noLegend
    }
  });

  /* ───────────────────────────────────────────────────
     5. New Customers Trend — Bar
  ─────────────────────────────────────────────────── */
  mkChart('cNewCust', {
    type: 'bar',
    data: {
      labels: D[period].newCust.trend.labels,
      datasets: [{
        label: 'New customers',
        data: D[period].newCust.trend.data,
        backgroundColor: 'rgba(24,95,165,0.7)',
        borderRadius: 3,
        barPercentage: 0.55
      }]
    },
    options: {
      ..._responsive,
      plugins: _noLegend,
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 10 }, color: '#8e8e99' }
        },
        y: {
          ..._yGrid,
          ticks: { font: { size: 10 }, color: '#8e8e99' }
        }
      }
    }
  });

  /* ───────────────────────────────────────────────────
     6. Gold Closure Trend — Line
  ─────────────────────────────────────────────────── */
  mkChart('cClosureGrams', {
    type: 'line',
    data: {
      labels: D[period].closure.trend.labels,
      datasets: [{
        label: 'Grams released',
        data: D[period].closure.trend.grams,
        borderColor: '#1D9E75',
        backgroundColor: 'rgba(29,158,117,0.08)',
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: '#1D9E75',
        fill: true,
        tension: 0.35
      }]
    },
    options: {
      ..._responsive,
      plugins: _noLegend,
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 10 }, color: '#8e8e99' }
        },
        y: {
          ..._yGrid,
          ticks: {
            font: { size: 10 },
            color: '#8e8e99',
            callback: v => v + 'g'
          }
        }
      }
    }
  });

}
