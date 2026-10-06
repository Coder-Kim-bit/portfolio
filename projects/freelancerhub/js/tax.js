// =============================================
// tax.js — Kenya Tax Calculator
// =============================================

const Tax = {
    // 2026 KRA rates
    RATES: {
        TOT: 0.03,       // Turnover Tax 3%
        WHT_PROF: 0.05,  // Withholding Tax - Professional Services 5%
        WHT_DIGITAL: 0.15, // Withholding Tax - Digital Content 15%
        VAT: 0.16,       // VAT 16%
    },

    // Calculate Turnover Tax
    calcTOT(grossIncome) {
        return grossIncome * this.RATES.TOT;
    },

    // Calculate WHT
    calcWHT(amount, type = 'professional') {
        const rate = type === 'digital' ? this.RATES.WHT_DIGITAL : this.RATES.WHT_PROF;
        return amount * rate;
    },

    // Calculate VAT
    calcVAT(amount) {
        return amount * this.RATES.VAT;
    },

    // Get full tax summary for current year
    getSummary() {
        const incomeRecords = DB.getAll('income');
        const expenseRecords = DB.getAll('expenses');
        const settings = DB.getSettings();

        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        const currentQuarter = Math.floor(currentMonth / 3);

        // Filter by year
        const yearlyIncome = incomeRecords
            .filter(r => new Date(r.date).getFullYear() === currentYear)
            .reduce((sum, r) => sum + r.amount, 0);

        const yearlyExpenses = expenseRecords
            .filter(r => new Date(r.date).getFullYear() === currentYear)
            .reduce((sum, r) => sum + r.amount, 0);

        // Filter by quarter
        const quarterStart = new Date(currentYear, currentQuarter * 3, 1);
        const quarterEnd = new Date(currentYear, currentQuarter * 3 + 3, 0);

        const quarterlyIncome = incomeRecords
            .filter(r => {
                const d = new Date(r.date);
                return d >= quarterStart && d <= quarterEnd;
            })
            .reduce((sum, r) => sum + r.amount, 0);

        // Monthly income
        const monthlyIncome = incomeRecords
            .filter(r => {
                const d = new Date(r.date);
                return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
            })
            .reduce((sum, r) => sum + r.amount, 0);

        const totDue = this.calcTOT(quarterlyIncome);
        const netProfit = yearlyIncome - yearlyExpenses;

        const quarterNames = ['Q1 (Jan–Mar)', 'Q2 (Apr–Jun)', 'Q3 (Jul–Sep)', 'Q4 (Oct–Dec)'];

        return {
            yearlyIncome,
            yearlyExpenses,
            netProfit,
            quarterlyIncome,
            currentQuarterName: quarterNames[currentQuarter],
            totDue,
            totRate: this.RATES.TOT * 100,
            monthlyIncome,
            vatRate: this.RATES.VAT * 100,
            vatRegistered: settings.vatRegistered,
        };
    },

    // Render the tax page
    renderPage() {
        const s = this.getSummary();
        const fmt = (n) => `KES ${n.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;

        return `
        <div class="page-header">
            <div>
                <h2 class="page-title">Tax Calculator</h2>
                <p class="page-subtitle">Kenya Revenue Authority (KRA) estimates for ${new Date().getFullYear()}</p>
            </div>
        </div>

        <div class="tax-alert">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span>These are <strong>estimates</strong> to help you plan. Always consult a KRA-certified accountant for official filings.</span>
        </div>

        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-label">Yearly Gross Income</div>
                <div class="stat-value green">${fmt(s.yearlyIncome)}</div>
                <div class="stat-sub">Total income this year</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Yearly Expenses</div>
                <div class="stat-value red">${fmt(s.yearlyExpenses)}</div>
                <div class="stat-sub">Total deductible expenses</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Net Profit</div>
                <div class="stat-value ${s.netProfit >= 0 ? 'green' : 'red'}">${fmt(s.netProfit)}</div>
                <div class="stat-sub">Income minus expenses</div>
            </div>
        </div>

        <div class="cards-grid">
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Turnover Tax (TOT)</h3>
                    <span class="badge badge-primary">3% Rate</span>
                </div>
                <div class="card-body">
                    <div class="tax-breakdown">
                        <div class="tax-row">
                            <span>${s.currentQuarterName} Income</span>
                            <strong>${fmt(s.quarterlyIncome)}</strong>
                        </div>
                        <div class="tax-row">
                            <span>TOT Rate</span>
                            <strong>${s.totRate}%</strong>
                        </div>
                        <div class="tax-row total-row">
                            <span>TOT Due This Quarter</span>
                            <strong class="green">${fmt(s.totDue)}</strong>
                        </div>
                    </div>
                    <p class="tax-note">Payable quarterly via iTax portal. Due 20th of the month following quarter end.</p>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Withholding Tax (WHT)</h3>
                    <span class="badge badge-secondary">On Deduction</span>
                </div>
                <div class="card-body">
                    <div class="tax-breakdown">
                        <div class="tax-row">
                            <span>Professional Services</span>
                            <strong>5%</strong>
                        </div>
                        <div class="tax-row">
                            <span>Digital Content Creators</span>
                            <strong>15%</strong>
                        </div>
                        <div class="tax-row">
                            <span>Consultancy Services</span>
                            <strong>5%</strong>
                        </div>
                    </div>
                    <p class="tax-note">WHT is deducted by the client at source. Claim via KRA iTax using WHT certificates.</p>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">VAT Calculator</h3>
                    <span class="badge ${s.vatRegistered ? 'badge-success' : 'badge-muted'}">${s.vatRegistered ? 'Registered' : 'Not Registered'}</span>
                </div>
                <div class="card-body">
                    <div class="tax-breakdown">
                        <div class="tax-row">
                            <span>Standard Rate</span>
                            <strong>16%</strong>
                        </div>
                        <div class="tax-row">
                            <span>Registration Threshold</span>
                            <strong>KES 5M/year</strong>
                        </div>
                    </div>
                    <div class="vat-calc mt-2">
                        <input type="number" id="vat-input" class="form-input" placeholder="Enter amount (KES)" />
                        <button class="btn btn-outline mt-1" onclick="Tax.calcVATDisplay()">Calculate VAT</button>
                        <div id="vat-result" class="tax-result"></div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Annual Tax Summary</h3>
                    <span class="badge badge-primary">${new Date().getFullYear()}</span>
                </div>
                <div class="card-body">
                    <div class="tax-breakdown">
                        <div class="tax-row">
                            <span>Estimated Annual TOT</span>
                            <strong>${fmt(this.calcTOT(s.yearlyIncome))}</strong>
                        </div>
                        <div class="tax-row">
                            <span>Total Income</span>
                            <strong>${fmt(s.yearlyIncome)}</strong>
                        </div>
                        <div class="tax-row">
                            <span>Total Expenses</span>
                            <strong>${fmt(s.yearlyExpenses)}</strong>
                        </div>
                        <div class="tax-row total-row">
                            <span>Effective Tax Rate</span>
                            <strong>${s.yearlyIncome > 0 ? ((this.calcTOT(s.yearlyIncome) / s.yearlyIncome) * 100).toFixed(1) : 0}%</strong>
                        </div>
                    </div>
                    <p class="tax-note">Annual return due 30th June. File via KRA iTax at itax.kra.go.ke</p>
                </div>
            </div>
        </div>
        `;
    },

    calcVATDisplay() {
        const input = document.getElementById('vat-input');
        const result = document.getElementById('vat-result');
        const amount = parseFloat(input.value);
        if (!amount || isNaN(amount)) { result.innerHTML = '<span class="error">Enter a valid amount.</span>'; return; }
        const vat = this.calcVAT(amount);
        const total = amount + vat;
        const fmt = (n) => `KES ${n.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;
        result.innerHTML = `
            <div class="tax-row"><span>Amount (ex-VAT)</span><strong>${fmt(amount)}</strong></div>
            <div class="tax-row"><span>VAT (16%)</span><strong class="green">${fmt(vat)}</strong></div>
            <div class="tax-row total-row"><span>Total (inc-VAT)</span><strong>${fmt(total)}</strong></div>
        `;
    }
};
