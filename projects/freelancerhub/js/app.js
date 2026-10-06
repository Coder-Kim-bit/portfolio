// =============================================
// app.js — Main App Router & State Management
// =============================================

const App = {
    state: {
        currentPage: 'dashboard'
    },

    init() {
        // Seed first-time demo records
        DB.seedIfEmpty();
        
        // Listen to navigation clicks
        this.bindEvents();
        
        // Load default page
        this.navigate(this.state.currentPage);
    },

    bindEvents() {
        document.querySelectorAll('.sidebar-nav a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.getAttribute('data-page');
                if (page) this.navigate(page);
            });
        });
    },

    navigate(page) {
        this.state.currentPage = page;
        
        // Update sidebar visual active state
        document.querySelectorAll('.sidebar-nav a').forEach(link => {
            if (link.getAttribute('data-page') === page) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        // Render page content
        const container = document.getElementById('main-content');
        
        switch (page) {
            case 'dashboard':
                container.innerHTML = this.renderDashboard();
                break;
            case 'invoices':
                container.innerHTML = Invoices.renderPage();
                break;
            case 'clients':
                container.innerHTML = Clients.renderPage();
                break;
            case 'finance':
                container.innerHTML = Finance.renderPage();
                break;
            case 'tax':
                container.innerHTML = Tax.renderPage();
                break;
            case 'settings':
                container.innerHTML = this.renderSettings();
                break;
            default:
                container.innerHTML = '<h2>404 Page Not Found</h2>';
        }
    },

    renderDashboard() {
        const invoices = DB.getAll('invoices');
        const income = DB.getAll('income');
        const expenses = DB.getAll('expenses');
        const settings = DB.getSettings();

        // Calculations
        const totalIncome = income.reduce((s, i) => s + i.amount, 0);
        const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
        const unpaidInvoices = invoices.filter(i => i.status !== 'paid');
        const unpaidSum = unpaidInvoices.reduce((s, i) => s + i.total, 0);
        const netProfit = totalIncome - totalExpenses;
        
        // Quarterly Tax due estimate
        const currentQuarter = Math.floor(new Date().getMonth() / 3);
        const currentYear = new Date().getFullYear();
        const quarterStart = new Date(currentYear, currentQuarter * 3, 1);
        const quarterEnd = new Date(currentYear, currentQuarter * 3 + 3, 0);
        const quarterlyIncome = income
            .filter(r => {
                const d = new Date(r.date);
                return d >= quarterStart && d <= quarterEnd;
            })
            .reduce((sum, r) => sum + r.amount, 0);
        const estTaxDue = quarterlyIncome * 0.03; // 3% Turnover Tax

        const fmt = (n) => `KES ${n.toLocaleString()}`;

        // Get 4 most recent invoices
        const recentInvoices = [...invoices].sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 4);

        return `
        <div class="page-header">
            <div>
                <h2 class="page-title">Habari, ${settings.ownerName || 'Freelancer'}!</h2>
                <p class="page-subtitle">Here is your financial status today.</p>
            </div>
            <div style="display:flex;gap:10px;">
                <button class="btn btn-outline" onclick="Finance.openModal('expense')">+ Log Expense</button>
                <button class="btn btn-primary" onclick="Invoices.openModal()">+ Create Invoice</button>
            </div>
        </div>

        <!-- Dashboard Stats -->
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-label">Net Income</div>
                <div class="stat-value green">${fmt(netProfit)}</div>
                <div class="stat-sub">Gross income minus expenses</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Unpaid Invoices</div>
                <div class="stat-value orange">${fmt(unpaidSum)}</div>
                <div class="stat-sub">${unpaidInvoices.length} invoices pending payment</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Est. KRA Tax Due</div>
                <div class="stat-value yellow">${fmt(estTaxDue)}</div>
                <div class="stat-sub">Quarterly Turnover Tax (3% TOT)</div>
            </div>
        </div>

        <div class="cards-grid mt-3">
            <!-- Recent Invoices -->
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Recent Invoices</h3>
                    <button class="btn btn-ghost btn-sm" onclick="App.navigate('invoices')">View All</button>
                </div>
                <div class="card-body p-0">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Number</th>
                                <th>Client</th>
                                <th>Total</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${recentInvoices.length === 0 ? '<tr><td colspan="4" class="empty-row">No invoices generated yet.</td></tr>' :
                            recentInvoices.map(inv => `
                            <tr>
                                <td class="fw-600">${inv.number}</td>
                                <td>${inv.clientName}</td>
                                <td class="fw-600">${fmt(inv.total)}</td>
                                <td><span class="badge ${inv.status === 'paid' ? 'badge-success' : (inv.status === 'sent' ? 'badge-primary' : 'badge-muted')}">${inv.status.toUpperCase()}</span></td>
                            </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Tax Alert & Insights -->
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Tax & Compliance Hub</h3>
                </div>
                <div class="card-body">
                    <div class="compliance-box">
                        <div class="compliance-item">
                            <span class="indicator green"></span>
                            <div>
                                <strong>eTIMS Compliance Notice</strong>
                                <p>Ensure all invoices are exported and prepared for matching with KRA's eTIMS validation portal.</p>
                            </div>
                        </div>
                        <div class="compliance-item mt-2">
                            <span class="indicator yellow"></span>
                            <div>
                                <strong>Quarterly Return Due Date</strong>
                                <p>Turnover Tax returns are filed quarterly. Ensure your Q3 payments are settled by the 20th of next month.</p>
                            </div>
                        </div>
                    </div>
                    <button class="btn btn-outline w-100 mt-2" onclick="App.navigate('tax')">Open Tax Portal</button>
                </div>
            </div>
        </div>
        `;
    },

    renderSettings() {
        const settings = DB.getSettings();
        return `
        <div class="page-header">
            <div>
                <h2 class="page-title">Settings</h2>
                <p class="page-subtitle">Configure your business details and tax defaults</p>
            </div>
        </div>

        <div class="card max-w-lg">
            <div class="card-body">
                <h3 class="section-title">Business Information</h3>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Business Name</label>
                        <input type="text" id="set-bizname" class="form-input" value="${settings.businessName || ''}" placeholder="e.g. Pixel Design Agency" />
                    </div>
                    <div class="form-group">
                        <label class="form-label">Owner Full Name</label>
                        <input type="text" id="set-owner" class="form-input" value="${settings.ownerName || ''}" placeholder="Your Name" />
                    </div>
                </div>

                <div class="form-row mt-2">
                    <div class="form-group">
                        <label class="form-label">Business Email</label>
                        <input type="email" id="set-email" class="form-input" value="${settings.email || ''}" placeholder="billing@agency.co.ke" />
                    </div>
                    <div class="form-group">
                        <label class="form-label">Business Phone</label>
                        <input type="text" id="set-phone" class="form-input" value="${settings.phone || ''}" placeholder="e.g. 0700000000" />
                    </div>
                </div>

                <div class="form-group mt-2">
                    <label class="form-label">Address</label>
                    <input type="text" id="set-address" class="form-input" value="${settings.address || ''}" placeholder="Office address, City, Kenya" />
                </div>

                <h3 class="section-title mt-4">KRA & Tax Configuration</h3>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">KRA PIN</label>
                        <input type="text" id="set-krapin" class="form-input" value="${settings.kraPin || ''}" placeholder="e.g. A001234567Z" />
                    </div>
                    <div class="form-group">
                        <label class="form-label">Default Tax Type</label>
                        <select id="set-taxtype" class="form-input">
                            <option value="TOT" ${settings.taxType === 'TOT' ? 'selected' : ''}>Turnover Tax (3% TOT)</option>
                            <option value="PAYE" ${settings.taxType === 'PAYE' ? 'selected' : ''}>Income Tax / PAYE</option>
                        </select>
                    </div>
                </div>

                <div class="form-group mt-2">
                    <label class="checkbox-label">
                        <input type="checkbox" id="set-vat" ${settings.vatRegistered ? 'checked' : ''} />
                        I am registered for VAT (16%)
                    </label>
                </div>

                <div class="form-group mt-2">
                    <label class="form-label">Invoice Default Notes</label>
                    <textarea id="set-notes" class="form-input" rows="3" placeholder="Enter bank info, payment methods (Till number/Paybill)...">${settings.notes || ''}</textarea>
                </div>

                <button class="btn btn-primary w-100 mt-4" onclick="App.saveSettings()">Save Settings</button>
            </div>
        </div>
        `;
    },

    saveSettings() {
        const settings = {
            businessName: document.getElementById('set-bizname').value.trim(),
            ownerName: document.getElementById('set-owner').value.trim(),
            email: document.getElementById('set-email').value.trim(),
            phone: document.getElementById('set-phone').value.trim(),
            address: document.getElementById('set-address').value.trim(),
            kraPin: document.getElementById('set-krapin').value.trim().toUpperCase(),
            taxType: document.getElementById('set-taxtype').value,
            vatRegistered: document.getElementById('set-vat').checked,
            notes: document.getElementById('set-notes').value.trim(),
        };

        DB.saveSettings(settings);
        alert('Settings updated successfully!');
        this.navigate('dashboard');
    }
};

window.onload = () => App.init();
