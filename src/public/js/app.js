/**
 * Bank Statement Analyzer — Frontend Application Logic
 */

(function () {
  'use strict';

  // ─── State ───
  let analysisData = null;

  // ─── DOM Refs ───
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const uploadArea = $('#uploadArea');
  const fileInput = $('#fileInput');
  const fileList = $('#fileList');
  const analyzeBtn = $('#analyzeBtn');
  const statusBadge = $('#statusBadge');
  const pageTitle = $('#pageTitle');
  const menuToggle = $('#menuToggle');
  const sidebar = $('#sidebar');

  // ─── Toast Notifications ───
  function showToast(message, type = 'info') {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(40px)';
      toast.style.transition = 'all 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // ─── Loading Overlay ───
  function showLoading(text = 'Analyzing...') {
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.id = 'loadingOverlay';
    overlay.innerHTML = `
      <div class="loading-box">
        <div class="loading-spinner"></div>
        <p>${text}</p>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  function hideLoading() {
    const el = $('#loadingOverlay');
    if (el) el.remove();
  }

  // ─── Format Helpers ───
  function formatCurrency(amount) {
    if (amount == null || isNaN(amount)) return '₹0';
    return '₹' + Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  function formatCurrencyFull(amount) {
    if (amount == null || isNaN(amount)) return '₹0.00';
    return '₹' + Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function formatPct(value) {
    return Number(value).toFixed(1) + '%';
  }

  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  // ─── Navigation ───
  const SECTION_TITLES = {
    'upload': 'Upload Bank Statements',
    'dashboard': 'Dashboard',
    'transactions': 'Transactions',
    'fy-comparison': 'FY Comparison',
    'categories': 'Category Analysis',
    'monthly': 'Monthly Trends',
    'fy-detail': 'FY Details',
    'downloads': 'Downloads'
  };

  function switchSection(sectionId) {
    $$('.content-section').forEach(s => s.classList.remove('active'));
    $$('.nav-item').forEach(n => n.classList.remove('active'));

    const section = $(`#section-${sectionId}`);
    const navItem = $(`.nav-item[data-section="${sectionId}"]`);

    if (section) section.classList.add('active');
    if (navItem) navItem.classList.add('active');
    if (pageTitle) pageTitle.textContent = SECTION_TITLES[sectionId] || '';

    // Close mobile sidebar
    if (sidebar) sidebar.classList.remove('open');
  }

  $$('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const section = item.dataset.section;

      // Don't allow navigating to analysis sections without data
      if (section !== 'upload' && !analysisData) {
        showToast('Upload and analyze files first', 'error');
        return;
      }

      switchSection(section);
    });
  });

  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  }

  // ─── File Upload ───
  uploadArea.addEventListener('click', () => fileInput.click());

  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
  });

  uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('drag-over');
  });

  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    if (e.dataTransfer.files.length > 0) {
      uploadFiles(e.dataTransfer.files);
    }
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
      uploadFiles(fileInput.files);
    }
  });

  async function uploadFiles(files) {
    const formData = new FormData();
    let validCount = 0;

    for (const file of files) {
      const ext = file.name.split('.').pop().toLowerCase();
      if (['csv', 'xlsx', 'xls', 'pdf'].includes(ext)) {
        formData.append('statements', file);
        validCount++;
      }
    }

    if (validCount === 0) {
      showToast('Only CSV, Excel, and PDF files are supported', 'error');
      return;
    }

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();

      if (data.success) {
        showToast(`${data.files.length} file(s) uploaded successfully`, 'success');
        loadFileList();
      } else {
        showToast(data.error || 'Upload failed', 'error');
      }
    } catch (err) {
      showToast('Upload failed: ' + err.message, 'error');
    }

    // Reset input
    fileInput.value = '';
  }

  // ─── File List ───
  async function loadFileList() {
    try {
      const res = await fetch('/api/files');
      const data = await res.json();

      if (data.files.length === 0) {
        fileList.innerHTML = '<p class="empty-msg">No files uploaded yet</p>';
        analyzeBtn.disabled = true;
        return;
      }

      analyzeBtn.disabled = false;

      fileList.innerHTML = data.files.map(f => {
        const ext = f.name.split('.').pop().toLowerCase();
        const icon = ext === 'csv' || ext === 'pdf' ? '📄' : '📊';
        return `
          <div class="file-item">
            <div class="file-item-info">
              <span class="file-item-icon">${icon}</span>
              <div>
                <div class="file-item-name">${escapeHtml(f.name)}</div>
                <div class="file-item-size">${formatFileSize(f.size)}</div>
              </div>
            </div>
            <button class="file-item-delete" data-file="${escapeHtml(f.name)}" title="Remove">✕</button>
          </div>
        `;
      }).join('');

      // Attach delete handlers
      $$('.file-item-delete').forEach(btn => {
        btn.addEventListener('click', async () => {
          const fileName = btn.dataset.file;
          try {
            await fetch(`/api/files/${encodeURIComponent(fileName)}`, { method: 'DELETE' });
            showToast(`${fileName} removed`, 'info');
            loadFileList();
          } catch (err) {
            showToast('Failed to delete file', 'error');
          }
        });
      });
    } catch (err) {
      fileList.innerHTML = '<p class="empty-msg">Failed to load files</p>';
    }
  }

  $('#refreshFiles').addEventListener('click', loadFileList);

  // ─── Analyze ───
  analyzeBtn.addEventListener('click', runAnalysis);

  async function runAnalysis() {
    showLoading('Analyzing your bank statements...');
    analyzeBtn.disabled = true;

    try {
      const res = await fetch('/api/analyze', { method: 'POST' });
      const data = await res.json();

      if (data.error) {
        showToast(data.error, 'error');
        hideLoading();
        analyzeBtn.disabled = false;
        return;
      }

      analysisData = data;
      statusBadge.textContent = `${data.totalTransactions} transactions loaded`;
      statusBadge.classList.add('success');

      renderDashboard();
      renderTransactions();
      renderFYComparison();
      renderCategories();
      renderMonthly();
      renderFYDetail();
      renderDownloads();

      hideLoading();
      showToast('Analysis complete!', 'success');
      switchSection('dashboard');
    } catch (err) {
      hideLoading();
      showToast('Analysis failed: ' + err.message, 'error');
    }

    analyzeBtn.disabled = false;
  }

  // ─── Transactions Table ───
  const TXN_PAGE_SIZE = 50;
  let txnState = { filtered: [], sortKey: 'id', sortAsc: true, page: 1 };

  function renderTransactions() {
    const txns = analysisData.transactions || [];
    if (!txns.length) return;

    // Populate category filter
    const catSet = new Set(txns.map(t => t.category));
    const catSelect = $('#txnFilterCategory');
    catSelect.innerHTML = '<option value="all">All Categories</option>';
    [...catSet].sort().forEach(c => {
      catSelect.innerHTML += `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`;
    });

    // Populate FY filter
    const fySelect = $('#txnFilterFY');
    fySelect.innerHTML = '<option value="all">All FYs</option>';
    (analysisData.fyLabels || []).forEach(fy => {
      fySelect.innerHTML += `<option value="${fy}">${fy}</option>`;
    });

    // Initial state
    txnState.filtered = txns.slice();
    txnState.page = 1;
    txnState.sortKey = 'id';
    txnState.sortAsc = true;
    applyTxnFilters();

    // Event listeners
    $('#txnSearch').addEventListener('input', debounce(applyTxnFilters, 250));
    $('#txnFilterType').addEventListener('change', applyTxnFilters);
    catSelect.addEventListener('change', applyTxnFilters);
    fySelect.addEventListener('change', applyTxnFilters);
    $('#txnClearFilters').addEventListener('click', () => {
      $('#txnSearch').value = '';
      $('#txnFilterType').value = 'all';
      catSelect.value = 'all';
      fySelect.value = 'all';
      applyTxnFilters();
    });

    // Sort headers
    $$('.txn-sortable').forEach(th => {
      th.addEventListener('click', () => {
        const key = th.dataset.sort;
        if (txnState.sortKey === key) {
          txnState.sortAsc = !txnState.sortAsc;
        } else {
          txnState.sortKey = key;
          txnState.sortAsc = true;
        }
        sortAndRenderTxn();
      });
    });
  }

  function getFYFromDate(dateStr) {
    const d = new Date(dateStr);
    const month = d.getMonth();
    const year = d.getFullYear();
    const fyStart = month >= 3 ? year : year - 1;
    return `FY ${fyStart}-${String(fyStart + 1).slice(2)}`;
  }

  function applyTxnFilters() {
    const txns = analysisData.transactions || [];
    const search = ($('#txnSearch').value || '').toLowerCase().trim();
    const typeFilter = $('#txnFilterType').value;
    const catFilter = $('#txnFilterCategory').value;
    const fyFilter = $('#txnFilterFY').value;

    txnState.filtered = txns.filter(t => {
      if (search) {
        const inDescription = (t.description || '').toLowerCase().includes(search);
        const inCategory = (t.category || '').toLowerCase().includes(search);
        const inCheque = (t.chequeNo || '').toLowerCase().includes(search);
        const inBank = (t.bankName || '').toLowerCase().includes(search)
          || (t.sheetName || '').toLowerCase().includes(search);
        if (!inDescription && !inCategory && !inCheque && !inBank) return false;
      }
      if (typeFilter !== 'all' && t.type !== typeFilter) return false;
      if (catFilter !== 'all' && t.category !== catFilter) return false;
      if (fyFilter !== 'all' && getFYFromDate(t.date) !== fyFilter) return false;
      return true;
    });

    txnState.page = 1;
    sortAndRenderTxn();
  }

  function sortAndRenderTxn() {
    const key = txnState.sortKey;
    const asc = txnState.sortAsc;

    txnState.filtered.sort((a, b) => {
      let va = a[key], vb = b[key];
      if (key === 'date') { va = new Date(va); vb = new Date(vb); }
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      if (va < vb) return asc ? -1 : 1;
      if (va > vb) return asc ? 1 : -1;
      return 0;
    });

    renderTxnPage();
  }

  function renderTxnPage() {
    const list = txnState.filtered;
    const total = list.length;
    const totalPages = Math.max(1, Math.ceil(total / TXN_PAGE_SIZE));
    if (txnState.page > totalPages) txnState.page = totalPages;

    const start = (txnState.page - 1) * TXN_PAGE_SIZE;
    const pageItems = list.slice(start, start + TXN_PAGE_SIZE);

    // Summary bar
    const totalDebit = list.reduce((s, t) => s + t.debit, 0);
    const totalCredit = list.reduce((s, t) => s + t.credit, 0);
    $('#txnSummaryBar').innerHTML = `
      <span class="txn-summary-item">Showing <strong>${total.toLocaleString('en-IN')}</strong> transactions</span>
      <span class="txn-summary-item green">Total Credit: <strong>${formatCurrency(totalCredit)}</strong></span>
      <span class="txn-summary-item red">Total Debit: <strong>${formatCurrency(totalDebit)}</strong></span>
    `;

    // Table body
    const tbody = $('#txnTableBody');
    if (total === 0) {
      tbody.innerHTML = '<tr><td colspan="10" class="empty-msg">No transactions match your filters</td></tr>';
    } else {
      tbody.innerHTML = pageItems.map(t => {
        const typeBadge = t.type === 'credit'
          ? '<span class="txn-badge credit">Credit</span>'
          : '<span class="txn-badge debit">Debit</span>';
        const bankLabel = t.sheetName
          ? `${t.bankName || '-'} (${t.sheetName})`
          : (t.bankName || '-');
        return `
          <tr>
            <td>${t.id}</td>
            <td class="txn-date">${formatDate(t.date)}</td>
            <td class="txn-desc">${escapeHtml(t.description)}</td>
            <td>${escapeHtml(bankLabel)}</td>
            <td>${escapeHtml(t.chequeNo || '-')}</td>
            <td style="color:#dc2626">${t.debit ? formatCurrencyFull(t.debit) : '-'}</td>
            <td style="color:#16a34a">${t.credit ? formatCurrencyFull(t.credit) : '-'}</td>
            <td>${formatCurrencyFull(t.balance)}</td>
            <td><span class="txn-cat-badge">${escapeHtml(t.category)}</span></td>
            <td>${typeBadge}</td>
          </tr>
        `;
      }).join('');
    }

    // Pagination
    const pagDiv = $('#txnPagination');
    if (totalPages <= 1) {
      pagDiv.innerHTML = '';
      return;
    }

    let pagHtml = `<button class="btn btn-sm btn-outline" ${txnState.page <= 1 ? 'disabled' : ''} data-txnpage="${txnState.page - 1}">‹ Prev</button>`;
    const maxButtons = 7;
    let startPage = Math.max(1, txnState.page - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);
    if (endPage - startPage < maxButtons - 1) startPage = Math.max(1, endPage - maxButtons + 1);

    if (startPage > 1) pagHtml += `<button class="btn btn-sm btn-outline" data-txnpage="1">1</button>`;
    if (startPage > 2) pagHtml += `<span class="pag-dots">…</span>`;

    for (let i = startPage; i <= endPage; i++) {
      pagHtml += `<button class="btn btn-sm ${i === txnState.page ? 'btn-primary' : 'btn-outline'}" data-txnpage="${i}">${i}</button>`;
    }

    if (endPage < totalPages - 1) pagHtml += `<span class="pag-dots">…</span>`;
    if (endPage < totalPages) pagHtml += `<button class="btn btn-sm btn-outline" data-txnpage="${totalPages}">${totalPages}</button>`;

    pagHtml += `<button class="btn btn-sm btn-outline" ${txnState.page >= totalPages ? 'disabled' : ''} data-txnpage="${txnState.page + 1}">Next ›</button>`;

    pagDiv.innerHTML = pagHtml;

    pagDiv.querySelectorAll('[data-txnpage]').forEach(btn => {
      btn.addEventListener('click', () => {
        const p = parseInt(btn.dataset.txnpage);
        if (p >= 1 && p <= totalPages) {
          txnState.page = p;
          renderTxnPage();
          // Scroll table into view
          $('#txnTable').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function debounce(fn, ms) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), ms);
    };
  }

  // ─── Dashboard ───
  function renderDashboard() {
    const s = analysisData.overallStats;

    const statsGrid = $('#statsGrid');
    statsGrid.innerHTML = `
      <div class="stat-card">
        <div class="stat-label">Total Transactions</div>
        <div class="stat-value">${s.totalTransactions.toLocaleString('en-IN')}</div>
        <div class="stat-sub">${analysisData.fyLabels.length} Financial Years</div>
      </div>
      <div class="stat-card green">
        <div class="stat-label">Total Credits (Income)</div>
        <div class="stat-value">${formatCurrency(s.totalCredit)}</div>
        <div class="stat-sub">Avg: ${formatCurrency(s.avgCredit)} / txn</div>
      </div>
      <div class="stat-card red">
        <div class="stat-label">Total Debits (Expenses)</div>
        <div class="stat-value">${formatCurrency(s.totalDebit)}</div>
        <div class="stat-sub">Avg: ${formatCurrency(s.avgDebit)} / txn</div>
      </div>
      <div class="stat-card ${s.netFlow >= 0 ? 'green' : 'red'}">
        <div class="stat-label">Net Cash Flow</div>
        <div class="stat-value">${formatCurrency(s.netFlow)}</div>
        <div class="stat-sub">Savings: ${formatPct(s.totalCredit ? (s.netFlow / s.totalCredit) * 100 : 0)}</div>
      </div>
      <div class="stat-card purple">
        <div class="stat-label">Largest Credit</div>
        <div class="stat-value">${formatCurrency(s.maxCredit)}</div>
        <div class="stat-sub">${truncate(s.maxCreditDescription, 35)}</div>
      </div>
      <div class="stat-card orange">
        <div class="stat-label">Largest Debit</div>
        <div class="stat-value">${formatCurrency(s.maxDebit)}</div>
        <div class="stat-sub">${truncate(s.maxDebitDescription, 35)}</div>
      </div>
    `;

    // Charts
    renderOverviewChart(analysisData.fyComparison);
    renderSavingsChart(analysisData.fyComparison);

    // Top Categories bar chart
    renderTopCategoriesHTML(analysisData.topSpendingCategories);
  }

  function renderTopCategoriesHTML(categories) {
    const container = $('#topCategories');
    if (!categories || categories.length === 0) {
      container.innerHTML = '<p class="empty-msg">No category data</p>';
      return;
    }

    const maxSpent = categories[0].totalSpent;

    container.innerHTML = categories.map((cat, i) => {
      const pct = (cat.totalSpent / maxSpent) * 100;
      const color = CHART_COLORS[i % CHART_COLORS.length];
      return `
        <div class="cat-bar-row">
          <div class="cat-bar-label">${escapeHtml(cat.category)}</div>
          <div class="cat-bar-track">
            <div class="cat-bar-fill" style="width: ${pct}%; background: ${color};">
              ${formatPct(cat.percentOfTotal)}
            </div>
          </div>
          <div class="cat-bar-amount">${formatCurrency(cat.totalSpent)}</div>
        </div>
      `;
    }).join('');
  }

  // ─── FY Comparison ───
  function renderFYComparison() {
    renderFYComparisonChart(analysisData.fyComparison);

    // Table
    const table = $('#fyComparisonTable');
    table.querySelector('thead').innerHTML = `
      <tr>
        <th>Financial Year</th><th>Total Credit</th><th>Total Debit</th>
        <th>Net Flow</th><th>Transactions</th><th>Savings %</th>
      </tr>
    `;
    table.querySelector('tbody').innerHTML = analysisData.fyComparison.map(r => `
      <tr>
        <td><strong>${r.fy}</strong></td>
        <td style="color:#16a34a">${formatCurrencyFull(r.totalCredit)}</td>
        <td style="color:#dc2626">${formatCurrencyFull(r.totalDebit)}</td>
        <td style="color:${r.netFlow >= 0 ? '#16a34a' : '#dc2626'}">${formatCurrencyFull(r.netFlow)}</td>
        <td>${r.transactions}</td>
        <td>${formatPct(r.savingsRate)}</td>
      </tr>
    `).join('');

    // YoY
    renderYoYChart(analysisData.yoyGrowth);

    const yoyTable = $('#yoyTable');
    yoyTable.querySelector('thead').innerHTML = `
      <tr>
        <th>Period</th><th>Income Growth %</th><th>Expense Growth %</th><th>Net Flow Change</th>
      </tr>
    `;
    yoyTable.querySelector('tbody').innerHTML = analysisData.yoyGrowth.map(r => `
      <tr>
        <td>${r.from} → ${r.to}</td>
        <td style="color:${r.incomeGrowth >= 0 ? '#16a34a' : '#dc2626'}">${formatPct(r.incomeGrowth)}</td>
        <td style="color:${r.expenseGrowth >= 0 ? '#dc2626' : '#16a34a'}">${formatPct(r.expenseGrowth)}</td>
        <td style="color:${r.netFlowChange >= 0 ? '#16a34a' : '#dc2626'}">${formatCurrencyFull(r.netFlowChange)}</td>
      </tr>
    `).join('');
  }

  // ─── Categories ───
  function renderCategories() {
    renderCategoryPie(analysisData.categoryBreakdown, 'chartCategoryPie');
    renderCategoryBar(analysisData.categoryBreakdown);

    const totalDebit = analysisData.overallStats.totalDebit;
    const table = $('#categoryTable');
    table.querySelector('thead').innerHTML = `
      <tr>
        <th>Category</th><th>Total Debit</th><th>Total Credit</th><th>Txn Count</th><th>% of Spend</th>
      </tr>
    `;

    const entries = Object.entries(analysisData.categoryBreakdown)
      .sort((a, b) => b[1].debit - a[1].debit);

    table.querySelector('tbody').innerHTML = entries.map(([cat, data]) => {
      const pct = totalDebit ? (data.debit / totalDebit) * 100 : 0;
      return `
        <tr>
          <td><strong>${escapeHtml(cat)}</strong></td>
          <td style="color:#dc2626">${formatCurrencyFull(data.debit)}</td>
          <td style="color:#16a34a">${formatCurrencyFull(data.credit)}</td>
          <td>${data.count}</td>
          <td>${formatPct(pct)}</td>
        </tr>
      `;
    }).join('');
  }

  // ─── Monthly Trends ───
  function renderMonthly() {
    // Populate filter
    const select = $('#monthlyFYFilter');
    select.innerHTML = '<option value="all">All FYs</option>';
    analysisData.fyLabels.forEach(fy => {
      select.innerHTML += `<option value="${fy}">${fy}</option>`;
    });

    select.addEventListener('change', () => {
      renderMonthlyChart(analysisData.monthlyTrend, select.value);
    });

    renderMonthlyChart(analysisData.monthlyTrend, 'all');
  }

  // ─── FY Detail ───
  function renderFYDetail() {
    const select = $('#fyDetailSelect');
    select.innerHTML = '';
    analysisData.fyLabels.forEach((fy, i) => {
      select.innerHTML += `<option value="${fy}" ${i === analysisData.fyLabels.length - 1 ? 'selected' : ''}>${fy}</option>`;
    });

    function renderFYData(fyLabel) {
      const detail = analysisData.fyDetail[fyLabel];
      if (!detail) return;

      const s = detail.stats;
      const statsGrid = $('#fyDetailStats');
      statsGrid.innerHTML = `
        <div class="stat-card green">
          <div class="stat-label">Total Credit</div>
          <div class="stat-value">${formatCurrency(s.totalCredit)}</div>
        </div>
        <div class="stat-card red">
          <div class="stat-label">Total Debit</div>
          <div class="stat-value">${formatCurrency(s.totalDebit)}</div>
        </div>
        <div class="stat-card ${s.netFlow >= 0 ? 'green' : 'red'}">
          <div class="stat-label">Net Flow</div>
          <div class="stat-value">${formatCurrency(s.netFlow)}</div>
        </div>
        <div class="stat-card purple">
          <div class="stat-label">Transactions</div>
          <div class="stat-value">${s.totalTransactions}</div>
        </div>
      `;

      // Charts
      renderCategoryPie(detail.categoryBreakdown, 'chartFYDetailPie');
      renderQuarterlyChart(detail.quarterlyStats);

      // Table
      const table = $('#fyDetailCatTable');
      table.querySelector('thead').innerHTML = `
        <tr><th>Category</th><th>Debit</th><th>Credit</th><th>Count</th><th>% of FY Spend</th></tr>
      `;

      const entries = Object.entries(detail.categoryBreakdown)
        .sort((a, b) => b[1].debit - a[1].debit);

      table.querySelector('tbody').innerHTML = entries.map(([cat, data]) => {
        const pct = s.totalDebit ? (data.debit / s.totalDebit) * 100 : 0;
        return `
          <tr>
            <td><strong>${escapeHtml(cat)}</strong></td>
            <td style="color:#dc2626">${formatCurrencyFull(data.debit)}</td>
            <td style="color:#16a34a">${formatCurrencyFull(data.credit)}</td>
            <td>${data.count}</td>
            <td>${formatPct(pct)}</td>
          </tr>
        `;
      }).join('');
    }

    select.addEventListener('change', () => renderFYData(select.value));
    renderFYData(select.value);
  }

  // ─── Downloads ───
  function renderDownloads() {
    const grid = $('#downloadsGrid');
    const d = analysisData.downloads;

    let html = '';

    if (d.excel) {
      html += `
        <div class="download-card">
          <span class="download-icon">📊</span>
          <div class="download-info">
            <h4>${escapeHtml(d.excel)}</h4>
            <p>Multi-sheet Excel with Dashboard, FY Comparison, Categories, Monthly Trends</p>
          </div>
          <a class="btn btn-primary btn-sm" href="/downloads/${encodeURIComponent(d.excel)}" download>Download</a>
        </div>
      `;
    }

    if (d.csv && d.csv.length > 0) {
      const csvLabels = {
        'fy_comparison.csv': 'FY Comparison',
        'category_summary.csv': 'Category Summary',
        'monthly_trends.csv': 'Monthly Trends',
        'yoy_growth.csv': 'Year-over-Year Growth',
        'all_transactions.csv': 'All Transactions (Raw)'
      };

      d.csv.forEach(f => {
        html += `
          <div class="download-card">
            <span class="download-icon">📄</span>
            <div class="download-info">
              <h4>${escapeHtml(f)}</h4>
              <p>${csvLabels[f] || 'CSV Report'}</p>
            </div>
            <a class="btn btn-outline btn-sm" href="/downloads/${encodeURIComponent(f)}" download>Download</a>
          </div>
        `;
      });
    }

    grid.innerHTML = html || '<p class="empty-msg">No reports generated yet</p>';
  }

  // ─── Utilities ───
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  function truncate(str, len) {
    if (!str) return '';
    return str.length > len ? str.slice(0, len) + '...' : str;
  }

  // ─── Init ───
  loadFileList();
})();
