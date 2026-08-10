/**
 * Chart rendering module using Chart.js.
 */

const CHART_COLORS = [
  '#2563eb', '#16a34a', '#dc2626', '#ea580c', '#7c3aed',
  '#0891b2', '#ca8a04', '#be185d', '#4f46e5', '#059669',
  '#d97706', '#9333ea', '#e11d48', '#0d9488', '#6366f1'
];

const BAR_COLORS = CHART_COLORS;

// Store chart instances so we can destroy before re-rendering
const chartInstances = {};

function destroyChart(id) {
  if (chartInstances[id]) {
    chartInstances[id].destroy();
    delete chartInstances[id];
  }
}

function createChart(canvasId, config) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId);
  if (!ctx) return null;
  chartInstances[canvasId] = new Chart(ctx, config);
  return chartInstances[canvasId];
}

// ─── Overview: Grouped Bar (Credit vs Debit per FY) ───
function renderOverviewChart(fyComparison) {
  createChart('chartOverview', {
    type: 'bar',
    data: {
      labels: fyComparison.map(r => r.fy),
      datasets: [
        {
          label: 'Credit (Income)',
          data: fyComparison.map(r => r.totalCredit),
          backgroundColor: '#16a34a',
          borderRadius: 6
        },
        {
          label: 'Debit (Expense)',
          data: fyComparison.map(r => r.totalDebit),
          backgroundColor: '#dc2626',
          borderRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'top' },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.dataset.label}: ₹${ctx.raw.toLocaleString('en-IN')}`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: v => '₹' + (v / 100000).toFixed(1) + 'L'
          }
        }
      }
    }
  });
}

// ─── Savings Rate Line Chart ───
function renderSavingsChart(fyComparison) {
  createChart('chartSavings', {
    type: 'line',
    data: {
      labels: fyComparison.map(r => r.fy),
      datasets: [{
        label: 'Savings Rate %',
        data: fyComparison.map(r => r.savingsRate),
        borderColor: '#7c3aed',
        backgroundColor: 'rgba(124, 58, 237, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 6,
        pointBackgroundColor: '#7c3aed'
      }]
    },
    options: {
      responsive: true,
      plugins: {
        tooltip: {
          callbacks: {
            label: ctx => `Savings: ${ctx.raw.toFixed(1)}%`
          }
        }
      },
      scales: {
        y: { ticks: { callback: v => v + '%' } }
      }
    }
  });
}

// ─── FY Comparison Stacked Bar ───
function renderFYComparisonChart(fyComparison) {
  const netPositive = fyComparison.map(r => Math.max(0, r.netFlow));
  const netNegative = fyComparison.map(r => Math.min(0, r.netFlow));

  createChart('chartFYComparison', {
    type: 'bar',
    data: {
      labels: fyComparison.map(r => r.fy),
      datasets: [
        {
          label: 'Credit',
          data: fyComparison.map(r => r.totalCredit),
          backgroundColor: '#16a34a',
          borderRadius: 4
        },
        {
          label: 'Debit',
          data: fyComparison.map(r => r.totalDebit),
          backgroundColor: '#dc2626',
          borderRadius: 4
        },
        {
          label: 'Net Flow',
          data: fyComparison.map(r => r.netFlow),
          type: 'line',
          borderColor: '#2563eb',
          backgroundColor: 'transparent',
          pointRadius: 6,
          pointBackgroundColor: '#2563eb',
          tension: 0.3,
          borderWidth: 3
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.dataset.label}: ₹${ctx.raw.toLocaleString('en-IN')}`
          }
        }
      },
      scales: {
        y: {
          ticks: {
            callback: v => '₹' + (v / 100000).toFixed(1) + 'L'
          }
        }
      }
    }
  });
}

// ─── YoY Growth Chart ───
function renderYoYChart(yoyGrowth) {
  createChart('chartYoY', {
    type: 'bar',
    data: {
      labels: yoyGrowth.map(r => `${r.from} → ${r.to}`),
      datasets: [
        {
          label: 'Income Growth %',
          data: yoyGrowth.map(r => r.incomeGrowth),
          backgroundColor: '#16a34a',
          borderRadius: 4
        },
        {
          label: 'Expense Growth %',
          data: yoyGrowth.map(r => r.expenseGrowth),
          backgroundColor: '#dc2626',
          borderRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: { ticks: { callback: v => v + '%' } }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.dataset.label}: ${ctx.raw.toFixed(1)}%`
          }
        }
      }
    }
  });
}

// ─── Category Pie Chart ───
function renderCategoryPie(categoryBreakdown, canvasId = 'chartCategoryPie') {
  const entries = Object.entries(categoryBreakdown)
    .filter(([, v]) => v.debit > 0)
    .sort((a, b) => b[1].debit - a[1].debit)
    .slice(0, 12);

  createChart(canvasId, {
    type: 'doughnut',
    data: {
      labels: entries.map(([k]) => k),
      datasets: [{
        data: entries.map(([, v]) => v.debit),
        backgroundColor: CHART_COLORS.slice(0, entries.length),
        borderWidth: 2,
        borderColor: '#fff'
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'right', labels: { font: { size: 12 } } },
        tooltip: {
          callbacks: {
            label: ctx => {
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
              const pct = ((ctx.raw / total) * 100).toFixed(1);
              return `${ctx.label}: ₹${ctx.raw.toLocaleString('en-IN')} (${pct}%)`;
            }
          }
        }
      }
    }
  });
}

// ─── Category Horizontal Bar ───
function renderCategoryBar(categoryBreakdown) {
  const entries = Object.entries(categoryBreakdown)
    .sort((a, b) => b[1].debit - a[1].debit)
    .slice(0, 10);

  createChart('chartCategoryBar', {
    type: 'bar',
    data: {
      labels: entries.map(([k]) => k),
      datasets: [
        {
          label: 'Debit',
          data: entries.map(([, v]) => v.debit),
          backgroundColor: '#dc2626',
          borderRadius: 4
        },
        {
          label: 'Credit',
          data: entries.map(([, v]) => v.credit),
          backgroundColor: '#16a34a',
          borderRadius: 4
        }
      ]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      plugins: {
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.dataset.label}: ₹${ctx.raw.toLocaleString('en-IN')}`
          }
        }
      },
      scales: {
        x: {
          ticks: { callback: v => '₹' + (v / 1000).toFixed(0) + 'K' }
        }
      }
    }
  });
}

// ─── Monthly Trend Chart ───
function renderMonthlyChart(monthlyTrend, filterFY = 'all') {
  let data = monthlyTrend;
  if (filterFY !== 'all') {
    data = data.filter(r => r.fy === filterFY);
  }

  createChart('chartMonthly', {
    type: 'bar',
    data: {
      labels: data.map(r => r.month),
      datasets: [
        {
          label: 'Credit',
          data: data.map(r => r.totalCredit),
          backgroundColor: 'rgba(22, 163, 74, 0.7)',
          borderRadius: 3
        },
        {
          label: 'Debit',
          data: data.map(r => r.totalDebit),
          backgroundColor: 'rgba(220, 38, 38, 0.7)',
          borderRadius: 3
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.dataset.label}: ₹${ctx.raw.toLocaleString('en-IN')}`
          }
        }
      },
      scales: {
        y: {
          ticks: { callback: v => '₹' + (v / 1000).toFixed(0) + 'K' }
        }
      }
    }
  });

  // Net flow line
  createChart('chartMonthlyNet', {
    type: 'line',
    data: {
      labels: data.map(r => r.month),
      datasets: [{
        label: 'Net Cash Flow',
        data: data.map(r => r.netFlow),
        borderColor: '#2563eb',
        backgroundColor: ctx => {
          const value = ctx.raw;
          return value >= 0 ? 'rgba(22, 163, 74, 0.15)' : 'rgba(220, 38, 38, 0.15)';
        },
        fill: true,
        tension: 0.3,
        pointRadius: 4
      }]
    },
    options: {
      responsive: true,
      plugins: {
        tooltip: {
          callbacks: {
            label: ctx => `Net: ₹${ctx.raw.toLocaleString('en-IN')}`
          }
        }
      },
      scales: {
        y: {
          ticks: { callback: v => '₹' + (v / 1000).toFixed(0) + 'K' }
        }
      }
    }
  });
}

// ─── FY Detail: Quarterly Bar ───
function renderQuarterlyChart(quarterlyStats) {
  const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
  const credits = quarters.map(q => quarterlyStats[q] ? quarterlyStats[q].totalCredit : 0);
  const debits = quarters.map(q => quarterlyStats[q] ? quarterlyStats[q].totalDebit : 0);

  createChart('chartFYQuarterly', {
    type: 'bar',
    data: {
      labels: quarters.map(q => q + ' (Apr-Jun/Jul-Sep/Oct-Dec/Jan-Mar)'.split('/')[quarters.indexOf(q)] || q),
      datasets: [
        { label: 'Credit', data: credits, backgroundColor: '#16a34a', borderRadius: 6 },
        { label: 'Debit', data: debits, backgroundColor: '#dc2626', borderRadius: 6 }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.dataset.label}: ₹${ctx.raw.toLocaleString('en-IN')}`
          }
        }
      },
      scales: {
        y: { ticks: { callback: v => '₹' + (v / 1000).toFixed(0) + 'K' } }
      }
    }
  });
}
