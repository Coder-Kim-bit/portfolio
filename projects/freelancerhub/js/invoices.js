// =============================================
// invoices.js — Invoice Management Module
// =============================================

const Invoices = {
    renderPage() {
        const invoices = DB.getAll('invoices').sort((a, b) => new Date(b.date) - new Date(a.date));
        const clients = DB.getAll('clients');

        const getStatusBadge = (status) => {
            const map = {
                draft: 'badge-muted',
                sent: 'badge-primary',
                paid: 'badge-success',
                overdue: 'badge-danger'
            };
            return `<span class="badge ${map[status] || 'badge-muted'}">${status.toUpperCase()}</span>`;
        };

        const fmt = (n) => `KES ${n.toLocaleString()}`;

        return `
        <div class="page-header">
            <div>
                <h2 class="page-title">Invoices</h2>
                <p class="page-subtitle">${invoices.length} total invoice${invoices.length !== 1 ? 's' : ''}</p>
            </div>
            <button class="btn btn-primary" onclick="Invoices.openModal()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                New Invoice
            </button>
        </div>

        ${invoices.length === 0 ? `
        <div class="empty-state">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            <h3>No invoices yet</h3>
            <p>Generate clean, professional invoices and track your payments.</p>
            <button class="btn btn-primary" onclick="Invoices.openModal()">Create First Invoice</button>
        </div>
        ` : `
        <div class="card">
            <div class="card-body p-0">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Number</th>
                            <th>Client</th>
                            <th>Date</th>
                            <th>Due Date</th>
                            <th>Status</th>
                            <th>Total</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${invoices.map(inv => `
                        <tr>
                            <td class="fw-600">${inv.number}</td>
                            <td>${inv.clientName}</td>
                            <td>${new Date(inv.date).toLocaleDateString('en-KE')}</td>
                            <td>${new Date(inv.dueDate).toLocaleDateString('en-KE')}</td>
                            <td>${getStatusBadge(inv.status)}</td>
                            <td class="fw-600">${fmt(inv.total)}</td>
                            <td>
                                <div class="action-buttons">
                                    <button class="btn btn-outline btn-sm" onclick="Invoices.view('${inv.id}')">View</button>
                                    ${inv.status !== 'paid' ? `<button class="btn btn-success btn-sm" onclick="Invoices.markAsPaid('${inv.id}')">Mark Paid</button>` : ''}
                                    <button class="btn btn-danger btn-sm" onclick="Invoices.delete('${inv.id}')">Delete</button>
                                </div>
                            </td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
        `;
    },

openModal(clientId = '') {
    document.getElementById('invoice-modal').style.display = 'flex';
    document.getElementById('invoice-items-body').innerHTML = '';

    const clients = DB.getAll('clients');

    document.getElementById('inv-client').innerHTML = `
        <option value="">Select a client</option>
        ${clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
    `;

    document.getElementById('inv-id').value = '';
    document.getElementById('inv-number').value = DB.nextInvoiceNumber();
    document.getElementById('inv-client').value = clientId;
    document.getElementById('inv-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('inv-duedate').value =
        new Date(Date.now() + 14*24*60*60*1000).toISOString().split('T')[0];

    document.getElementById('inv-status').value = 'draft';
    document.getElementById('inv-vat-toggle').value = '0';

    document.getElementById('inv-notes').value =
        DB.getSettings().notes ||
        'Payment due within 14 days.\nPay via M-Pesa Paybill / Till or Bank Transfer.';

    this.addItemRow();
    this.recalculate();
},
    addItemRow(desc = '', qty = 1, rate = 0) {
        const tbody = document.getElementById('invoice-items-body');
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><input type="text" class="form-input item-desc" placeholder="Service/Product Description" value="${desc}" /></td>
            <td><input type="number" class="form-input item-qty" min="1" value="${qty}" oninput="Invoices.recalculate()" /></td>
            <td><input type="number" class="form-input item-rate" min="0" placeholder="0.00" value="${rate}" oninput="Invoices.recalculate()" /></td>
            <td class="item-amount text-right fw-600">KES 0.00</td>
            <td><button class="icon-btn danger" onclick="this.closest('tr').remove(); Invoices.recalculate()">✕</button></td>
        `;
        tbody.appendChild(tr);
        this.recalculate();
    },

    recalculate() {
        const rows = document.querySelectorAll('#invoice-items-body tr');
        let subtotal = 0;

        rows.forEach(row => {
            const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
            const rate = parseFloat(row.querySelector('.item-rate').value) || 0;
            const amount = qty * rate;
            subtotal += amount;
            row.querySelector('.item-amount').textContent = `KES ${amount.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
        });

        const vatRate = parseFloat(document.getElementById('inv-vat-toggle').value) / 100;
        const vat = subtotal * vatRate;
        const total = subtotal + vat;

        document.getElementById('summary-subtotal').textContent = `KES ${subtotal.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
        document.getElementById('summary-vat').textContent = `KES ${vat.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
        document.getElementById('summary-total').textContent = `KES ${total.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
    },

    closeModal() {
        document.getElementById('invoice-modal').style.display = 'none';
    },

    save() {
        const clientId = document.getElementById('inv-client').value;
        const date = document.getElementById('inv-date').value;
        const dueDate = document.getElementById('inv-duedate').value;
        if (!clientId) { alert('Please select a client.'); return; }
        if (!date || !dueDate) { alert('Please select date and due date.'); return; }

        const rows = document.querySelectorAll('#invoice-items-body tr');
        const items = [];
        let subtotal = 0;

        rows.forEach(row => {
            const description = row.querySelector('.item-desc').value.trim();
            const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
            const rate = parseFloat(row.querySelector('.item-rate').value) || 0;
            if (description && qty > 0 && rate > 0) {
                const amount = qty * rate;
                subtotal += amount;
                items.push({ description, qty, rate, amount });
            }
        });

        if (items.length === 0) { alert('Please add at least one line item.'); return; }

        const vatRate = parseFloat(document.getElementById('inv-vat-toggle').value) / 100;
        const tax = subtotal * vatRate;
        const total = subtotal + tax;

        const client = DB.getById('clients', clientId);
        const invoice = {
            id: document.getElementById('inv-id').value || DB.uid(),
            number: document.getElementById('inv-number').value,
            clientId,
            clientName: client.name,
            status: document.getElementById('inv-status').value,
            date,
            dueDate,
            items,
            subtotal,
            tax,
            total,
            notes: document.getElementById('inv-notes').value,
            createdAt: new Date().toISOString()
        };

        DB.save('invoices', invoice);
        
        // If status is paid, automatically log income
        if (invoice.status === 'paid') {
            const hasIncome = DB.getAll('income').some(inc => inc.description && inc.description.includes(invoice.number));
            if (!hasIncome) {
                DB.save('income', {
                    id: DB.uid(),
                    date: invoice.date,
                    amount: invoice.total,
                    source: invoice.clientName,
                    description: `Payment for ${invoice.number}`,
                    method: 'M-Pesa',
                    createdAt: new Date().toISOString()
                });
            }
        }

        this.closeModal();
        App.navigate('invoices');
    },

    markAsPaid(id) {
        const inv = DB.getById('invoices', id);
        if (inv) {
            inv.status = 'paid';
            DB.save('invoices', inv);
            
            // Log income
            DB.save('income', {
                id: DB.uid(),
                date: new Date().toISOString().split('T')[0],
                amount: inv.total,
                source: inv.clientName,
                description: `Payment for ${inv.number}`,
                method: 'M-Pesa',
                createdAt: new Date().toISOString()
            });

            App.navigate('invoices');
        }
    },

    delete(id) {
        if (confirm('Are you sure you want to delete this invoice?')) {
            DB.delete('invoices', id);
            App.navigate('invoices');
        }
    },

    view(id) {
        const inv = DB.getById('invoices', id);
        if (!inv) return;
        const client = DB.getById('clients', inv.clientId) || {};
        const settings = DB.getSettings();

        const fmt = (n) => `KES ${n.toLocaleString(undefined, {minimumFractionDigits: 2})}`;

        const html = `
        <div class="invoice-box">
            <div class="invoice-header">
                <div>
                    <h2>INVOICE</h2>
                    <p class="invoice-num">${inv.number}</p>
                </div>
                <div class="text-right">
                    <h3>${settings.businessName || 'My Business'}</h3>
                    <p>${settings.ownerName || ''}</p>
                    <p>${settings.email || ''}</p>
                    <p>${settings.phone || ''}</p>
                    ${settings.kraPin ? `<p>KRA PIN: ${settings.kraPin}</p>` : ''}
                </div>
            </div>

            <hr class="invoice-divider" />

            <div class="invoice-details-grid">
                <div>
                    <h4 class="text-muted">Billed To</h4>
                    <strong>${inv.clientName}</strong>
                    <p>${client.company || ''}</p>
                    <p>${client.email || ''}</p>
                    <p>${client.phone || ''}</p>
                    <p>${client.address || ''}</p>
                </div>
                <div class="text-right">
                    <h4 class="text-muted">Invoice Dates</h4>
                    <p><strong>Issued:</strong> ${new Date(inv.date).toLocaleDateString('en-KE')}</p>
                    <p><strong>Due:</strong> ${new Date(inv.dueDate).toLocaleDateString('en-KE')}</p>
                    <p><strong>Status:</strong> ${inv.status.toUpperCase()}</p>
                </div>
            </div>

            <table class="invoice-items-table mt-3">
                <thead>
                    <tr>
                        <th>Description</th>
                        <th class="text-center">Qty</th>
                        <th class="text-right">Rate</th>
                        <th class="text-right">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${inv.items.map(item => `
                    <tr>
                        <td>${item.description}</td>
                        <td class="text-center">${item.qty}</td>
                        <td class="text-right">${fmt(item.rate)}</td>
                        <td class="text-right">${fmt(item.amount)}</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>

            <div class="invoice-summary mt-3">
                <div class="summary-group">
                    <div class="summary-line">
                        <span>Subtotal</span>
                        <span>${fmt(inv.subtotal)}</span>
                    </div>
                    ${inv.tax > 0 ? `
                    <div class="summary-line">
                        <span>VAT (16%)</span>
                        <span>${fmt(inv.tax)}</span>
                    </div>
                    ` : ''}
                    <div class="summary-line total-line">
                        <span>Total Due</span>
                        <span>${fmt(inv.total)}</span>
                    </div>
                </div>
            </div>

            ${inv.notes ? `
            <div class="invoice-notes mt-4">
                <h4 class="text-muted">Payment Instructions / Notes</h4>
                <p style="white-space: pre-line">${inv.notes}</p>
            </div>
            ` : ''}
        </div>
        `;

        document.getElementById('invoice-printable-content').innerHTML = html;
        document.getElementById('invoice-view-modal').style.display = 'flex';
    },

    closeViewModal() {
        document.getElementById('invoice-view-modal').style.display = 'none';
    }
};
