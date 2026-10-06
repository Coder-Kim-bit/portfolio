// =============================================
// finance.js — Income & Expense Management
// =============================================

const Finance = {
    renderPage() {
        const income = DB.getAll('income').sort((a, b) => new Date(b.date) - new Date(a.date));
        const expenses = DB.getAll('expenses').sort((a, b) => new Date(b.date) - new Date(a.date));
        const totalIncome = income.reduce((s, i) => s + i.amount, 0);
        const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
        const netProfit = totalIncome - totalExpenses;
        const fmt = (n) => `KES ${n.toLocaleString()}`;

        // Monthly chart data (last 6 months)
        const monthlyData = this.getMonthlyData();

        return `
        <div class="page-header">
            <div>
                <h2 class="page-title">Income & Expenses</h2>
                <p class="page-subtitle">Full financial record for ${new Date().getFullYear()}</p>
            </div>
            <div style="display:flex;gap:10px;">
                <button class="btn btn-outline" onclick="Finance.openModal('expense')">+ Expense</button>
                <button class="btn btn-primary" onclick="Finance.openModal('income')">+ Income</button>
            </div>
        </div>

        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-label">Total Income</div>
                <div class="stat-value green">${fmt(totalIncome)}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Total Expenses</div>
                <div class="stat-value red">${fmt(totalExpenses)}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Net Profit</div>
                <div class="stat-value ${netProfit >= 0 ? 'green' : 'red'}">${fmt(netProfit)}</div>
            </div>
        </div>

        <!-- Chart -->
        <div class="card mb-3">
            <div class="card-header"><h3 class="card-title">Monthly Overview (Last 6 Months)</h3></div>
            <div class="card-body">
                <div class="bar-chart">
                    ${monthlyData.map(m => `
                    <div class="bar-group">
                        <div class="bar-wrap">
                            <div class="bar bar-income" style="height:${m.incomeH}%" title="Income: KES ${m.income.toLocaleString()}"></div>
                            <div class="bar bar-expense" style="height:${m.expenseH}%" title="Expense: KES ${m.expense.toLocaleString()}"></div>
                        </div>
                        <div class="bar-label">${m.label}</div>
                    </div>`).join('')}
                </div>
                <div class="chart-legend">
                    <span class="legend-dot green"></span> Income
                    <span class="legend-dot red" style="margin-left:16px"></span> Expenses
                </div>
            </div>
        </div>

        <div class="cards-grid">
            <!-- Income Table -->
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Income Records</h3>
                    <span class="badge badge-success">${income.length} entries</span>
                </div>
                <div class="card-body p-0">
                    <table class="data-table">
                        <thead><tr><th>Date</th><th>Source</th><th>Method</th><th>Amount</th><th></th></tr></thead>
                        <tbody>
                            ${income.length === 0 ? '<tr><td colspan="5" class="empty-row">No income records yet.</td></tr>' :
                            income.map(r => `
                            <tr>
                                <td>${new Date(r.date).toLocaleDateString('en-KE')}</td>
                                <td>
                                    <div class="cell-main">${r.source}</div>
                                    <div class="cell-sub">${r.description || ''}</div>
                                </td>
                                <td><span class="badge badge-muted">${r.method || '—'}</span></td>
                                <td class="green fw-600">KES ${r.amount.toLocaleString()}</td>
                                <td><button class="icon-btn danger" onclick="Finance.deleteRecord('income','${r.id}')">✕</button></td>
                            </tr>`).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Expense Table -->
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Expense Records</h3>
                    <span class="badge badge-danger">${expenses.length} entries</span>
                </div>
                <div class="card-body p-0">
                    <table class="data-table">
                        <thead><tr><th>Date</th><th>Description</th><th>Category</th><th>Amount</th><th></th></tr></thead>
                        <tbody>
                            ${expenses.length === 0 ? '<tr><td colspan="5" class="empty-row">No expense records yet.</td></tr>' :
                            expenses.map(r => `
                            <tr>
                                <td>${new Date(r.date).toLocaleDateString('en-KE')}</td>
                                <td>${r.description}</td>
                                <td><span class="badge badge-muted">${r.category}</span></td>
                                <td class="red fw-600">KES ${r.amount.toLocaleString()}</td>
                                <td><button class="icon-btn danger" onclick="Finance.deleteRecord('expense','${r.id}')">✕</button></td>
                            </tr>`).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        `;
    },

    getMonthlyData() {
        const income = DB.getAll('income');
        const expenses = DB.getAll('expenses');
        const months = [];
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const m = d.getMonth(); const y = d.getFullYear();
            const inc = income.filter(r => { const rd = new Date(r.date); return rd.getMonth()===m && rd.getFullYear()===y; }).reduce((s,r)=>s+r.amount,0);
            const exp = expenses.filter(r => { const rd = new Date(r.date); return rd.getMonth()===m && rd.getFullYear()===y; }).reduce((s,r)=>s+r.amount,0);
            months.push({ label: d.toLocaleString('default',{month:'short'}), income: inc, expense: exp });
        }
        const maxVal = Math.max(...months.map(m => Math.max(m.income, m.expense)), 1);
        return months.map(m => ({ ...m, incomeH: Math.round((m.income/maxVal)*100), expenseH: Math.round((m.expense/maxVal)*100) }));
    },

    openModal(type = 'income') {
        document.getElementById('finance-modal').style.display = 'flex';
        document.getElementById('finance-modal-title').textContent = type === 'income' ? 'Log Income' : 'Log Expense';
        document.getElementById('finance-type').value = type;
        document.getElementById('finance-date').value = new Date().toISOString().split('T')[0];
        document.getElementById('income-fields').style.display = type === 'income' ? '' : 'none';
        document.getElementById('expense-fields').style.display = type === 'expense' ? '' : 'none';
        ['finance-amount','finance-source','finance-desc'].forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; });
    },

    closeModal() { document.getElementById('finance-modal').style.display = 'none'; },

    save() {
        const type = document.getElementById('finance-type').value;
        const date = document.getElementById('finance-date').value;
        const amount = parseFloat(document.getElementById('finance-amount').value);
        if (!date || !amount) { alert('Date and amount are required.'); return; }
        if (type === 'income') {
            DB.save('income', {
                id: DB.uid(), date, amount,
                source: document.getElementById('finance-source').value.trim(),
                description: document.getElementById('finance-desc').value.trim(),
                method: document.getElementById('finance-method').value,
                createdAt: new Date().toISOString()
            });
        } else {
            DB.save('expenses', {
                id: DB.uid(), date, amount,
                category: document.getElementById('finance-category').value,
                description: document.getElementById('finance-desc').value.trim(),
                createdAt: new Date().toISOString()
            });
        }
        this.closeModal();
        App.navigate('finance');
    },

    deleteRecord(type, id) {
        if (confirm('Delete this record?')) {
            DB.delete(type === 'income' ? 'income' : 'expenses', id);
            App.navigate('finance');
        }
    }
};
