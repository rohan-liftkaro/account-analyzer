export default function Home() {
  return (
    <>
      {/* ─── Sidebar ─── */}
      <aside className="sidebar" id="sidebar">
        <div className="sidebar-brand">
          <span className="brand-icon">📊</span>
          <h1>BankAnalyzer</h1>
        </div>
        <nav className="sidebar-nav">
          <a href="#" className="nav-item active" data-section="upload">
            <span className="nav-icon">📁</span> Upload Files
          </a>
          <a href="#" className="nav-item" data-section="dashboard">
            <span className="nav-icon">📈</span> Dashboard
          </a>
          <a href="#" className="nav-item" data-section="fy-comparison">
            <span className="nav-icon">🔄</span> FY Comparison
          </a>
          <a href="#" className="nav-item" data-section="transactions">
            <span className="nav-icon">📋</span> Transactions
          </a>
          <a href="#" className="nav-item" data-section="categories">
            <span className="nav-icon">🏷️</span> Categories
          </a>
          <a href="#" className="nav-item" data-section="monthly">
            <span className="nav-icon">📅</span> Monthly Trends
          </a>
          <a href="#" className="nav-item" data-section="fy-detail">
            <span className="nav-icon">🔍</span> FY Details
          </a>
          <a href="#" className="nav-item" data-section="downloads">
            <span className="nav-icon">⬇️</span> Downloads
          </a>
        </nav>
      </aside>

      {/* ─── Main Content ─── */}
      <main className="main-content">

        {/* Header */}
        <header className="top-bar">
          <button className="menu-toggle" id="menuToggle">☰</button>
          <h2 id="pageTitle">Upload Bank Statements</h2>
          <div className="top-bar-right">
            <span className="status-badge" id="statusBadge">No data loaded</span>
          </div>
        </header>

        {/* ─── Upload Section ─── */}
        <section className="content-section active" id="section-upload">
          <div className="upload-area" id="uploadArea">
            <div className="upload-icon">📂</div>
            <h3>Drag &amp; Drop Bank Statements Here</h3>
            <p>or click to browse files</p>
            <p className="upload-hint">Supports CSV, XLSX, XLS, PDF — Max 50MB per file</p>
            <input type="file" id="fileInput" multiple accept=".csv,.xlsx,.xls,.pdf" hidden />
          </div>

          <div className="file-list-section">
            <div className="section-header">
              <h3>Uploaded Files</h3>
              <button className="btn btn-sm btn-outline" id="refreshFiles">↻ Refresh</button>
            </div>
            <div className="file-list" id="fileList">
              <p className="empty-msg">No files uploaded yet</p>
            </div>
          </div>

          <div className="analyze-section">
            <button className="btn btn-primary btn-lg" id="analyzeBtn" disabled>
              <span className="btn-text">🚀 Analyze Statements</span>
              <span className="btn-loader hidden">⏳ Analyzing...</span>
            </button>
          </div>
        </section>

        {/* ─── Dashboard Section ─── */}
        <section className="content-section" id="section-dashboard">
          <div className="stats-grid" id="statsGrid"></div>
          <div className="chart-row">
            <div className="chart-card">
              <h3>Income vs Expenses (All FYs)</h3>
              <canvas id="chartOverview"></canvas>
            </div>
            <div className="chart-card">
              <h3>Savings Rate by FY</h3>
              <canvas id="chartSavings"></canvas>
            </div>
          </div>
          <div className="chart-card full-width">
            <h3>Top Spending Categories</h3>
            <div className="top-categories" id="topCategories"></div>
          </div>
        </section>

        {/* ─── Transactions Section ─── */}
        <section className="content-section" id="section-transactions">
          <div className="txn-toolbar">
            <div className="txn-search-box">
              <span className="search-icon">🔍</span>
              <input type="text" id="txnSearch" placeholder="Search by description, category..." autoComplete="off" />
            </div>
            <div className="txn-filters">
              <select id="txnFilterType">
                <option value="all">All Types</option>
                <option value="debit">Debit</option>
                <option value="credit">Credit</option>
              </select>
              <select id="txnFilterCategory">
                <option value="all">All Categories</option>
              </select>
              <select id="txnFilterFY">
                <option value="all">All FYs</option>
              </select>
              <button className="btn btn-outline btn-sm" id="txnClearFilters">Clear Filters</button>
            </div>
          </div>
          <div className="txn-summary-bar" id="txnSummaryBar"></div>
          <div className="table-card">
            <div className="txn-table-wrapper">
              <table className="data-table" id="txnTable">
                <thead>
                  <tr>
                    <th className="txn-sortable" data-sort="id">#</th>
                    <th className="txn-sortable" data-sort="date">Date ⇅</th>
                    <th>Description</th>
                    <th className="txn-sortable" data-sort="bankName">Bank Name ⇅</th>
                    <th className="txn-sortable" data-sort="chequeNo">Cheque No. ⇅</th>
                    <th className="txn-sortable" data-sort="debit">Debit ⇅</th>
                    <th className="txn-sortable" data-sort="credit">Credit ⇅</th>
                    <th className="txn-sortable" data-sort="balance">Balance ⇅</th>
                    <th>Category</th>
                    <th>Type</th>
                  </tr>
                </thead>
                <tbody id="txnTableBody"></tbody>
              </table>
            </div>
          </div>
          <div className="txn-pagination" id="txnPagination"></div>
        </section>

        {/* ─── FY Comparison Section ─── */}
        <section className="content-section" id="section-fy-comparison">
          <div className="chart-card full-width">
            <h3>Financial Year Comparison</h3>
            <canvas id="chartFYComparison"></canvas>
          </div>
          <div className="table-card">
            <table className="data-table" id="fyComparisonTable">
              <thead></thead>
              <tbody></tbody>
            </table>
          </div>
          <div className="chart-card full-width">
            <h3>Year-over-Year Growth</h3>
            <canvas id="chartYoY"></canvas>
          </div>
          <div className="table-card">
            <table className="data-table" id="yoyTable">
              <thead></thead>
              <tbody></tbody>
            </table>
          </div>
        </section>

        {/* ─── Categories Section ─── */}
        <section className="content-section" id="section-categories">
          <div className="chart-row">
            <div className="chart-card">
              <h3>Spending by Category</h3>
              <canvas id="chartCategoryPie"></canvas>
            </div>
            <div className="chart-card">
              <h3>Category-wise Debit vs Credit</h3>
              <canvas id="chartCategoryBar"></canvas>
            </div>
          </div>
          <div className="table-card">
            <h3>Category Breakdown</h3>
            <table className="data-table" id="categoryTable">
              <thead></thead>
              <tbody></tbody>
            </table>
          </div>
        </section>

        {/* ─── Monthly Trends Section ─── */}
        <section className="content-section" id="section-monthly">
          <div className="fy-filter">
            <label>Filter by FY:</label>
            <select id="monthlyFYFilter"><option value="all">All FYs</option></select>
          </div>
          <div className="chart-card full-width">
            <h3>Monthly Credit vs Debit</h3>
            <canvas id="chartMonthly"></canvas>
          </div>
          <div className="chart-card full-width">
            <h3>Monthly Net Cash Flow</h3>
            <canvas id="chartMonthlyNet"></canvas>
          </div>
        </section>

        {/* ─── FY Detail Section ─── */}
        <section className="content-section" id="section-fy-detail">
          <div className="fy-filter">
            <label>Select FY:</label>
            <select id="fyDetailSelect"></select>
          </div>
          <div className="stats-grid" id="fyDetailStats"></div>
          <div className="chart-row">
            <div className="chart-card">
              <h3>Category Breakdown</h3>
              <canvas id="chartFYDetailPie"></canvas>
            </div>
            <div className="chart-card">
              <h3>Quarterly Comparison</h3>
              <canvas id="chartFYQuarterly"></canvas>
            </div>
          </div>
          <div className="table-card">
            <h3>Category Details</h3>
            <table className="data-table" id="fyDetailCatTable">
              <thead></thead>
              <tbody></tbody>
            </table>
          </div>
        </section>

        {/* ─── Downloads Section ─── */}
        <section className="content-section" id="section-downloads">
          <div className="downloads-grid" id="downloadsGrid">
            <p className="empty-msg">Run analysis first to generate reports</p>
          </div>
        </section>

      </main>
    </>
  );
}
