// =============================================
// clients.js — Client Management Module
// =============================================

const Clients = {
    renderPage() {
        const clients = DB.getAll('clients');
        const invoices = DB.getAll('invoices');

        const getClientStats = (clientId) => {
            const clientInvoices = invoices.filter(inv => inv.clientId === clientId);
            const totalBilled = clientInvoices.reduce((s, i) => s + i.total, 0);
            const totalPaid = clientInvoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.total, 0);
            const outstanding = totalBilled - totalPaid;
            return { totalBilled, totalPaid, outstanding, invoiceCount: clientInvoices.length };
        };

        return `
        <div class="page-header">
            <div>
                <h2 class="page-title">Clients</h2>
                <p class="page-subtitle">${clients.length} client${clients.length !== 1 ? 's' : ''} in your book</p>
            </div>
            <button class="btn btn-primary" onclick="Clients.openModal()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add Client
            </button>
        </div>

        ${clients.length === 0 ? `
        <div class="empty-state">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <h3>No clients yet</h3>
            <p>Add your first client to start creating invoices.</p>
            <button class="btn btn-primary" onclick="Clients.openModal()">Add First Client</button>
        </div>
        ` : `
        <div class="clients-grid">
            ${clients.map(client => {
                const stats = getClientStats(client.id);
                return `
                <div class="client-card">
                    <div class="client-avatar">${client.name.charAt(0).toUpperCase()}</div>
                    <div class="client-info">
                        <h4 class="client-name">${client.name}</h4>
                        <p class="client-company">${client.company || '—'}</p>
                        <div class="client-contact">
                            ${client.email ? `<span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> ${client.email}</span>` : ''}
                            ${client.phone ? `<span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg> ${client.phone}</span>` : ''}
                        </div>
                    </div>
                    <div class="client-stats">
                        <div class="client-stat">
                            <span class="client-stat-val green">KES ${stats.totalPaid.toLocaleString()}</span>
                            <span class="client-stat-label">Paid</span>
                        </div>
                        <div class="client-stat">
                            <span class="client-stat-val ${stats.outstanding > 0 ? 'orange' : ''}">KES ${stats.outstanding.toLocaleString()}</span>
                            <span class="client-stat-label">Outstanding</span>
                        </div>
                        <div class="client-stat">
                            <span class="client-stat-val">${stats.invoiceCount}</span>
                            <span class="client-stat-label">Invoices</span>
                        </div>
                    </div>
                    <div class="client-actions">
                        <button class="btn btn-outline btn-sm" onclick="Clients.edit('${client.id}')">Edit</button>
                        <button class="btn btn-outline btn-sm" onclick="Invoices.openModal('${client.id}')">New Invoice</button>
                        <button class="btn btn-danger btn-sm" onclick="Clients.delete('${client.id}')">Delete</button>
                    </div>
                </div>
                `;
            }).join('')}
        </div>
        `}
        `;
    },

    openModal(id = null) {
        document.getElementById('client-modal').style.display = 'flex';
        document.getElementById('client-modal-title').textContent = id ? 'Edit Client' : 'Add Client';
        if (id) {
            const c = DB.getById('clients', id);
            if (c) {
                document.getElementById('client-id').value = c.id;
                document.getElementById('client-name').value = c.name || '';
                document.getElementById('client-company').value = c.company || '';
                document.getElementById('client-email').value = c.email || '';
                document.getElementById('client-phone').value = c.phone || '';
                document.getElementById('client-address').value = c.address || '';
            }
        } else {
            ['client-id','client-name','client-company','client-email','client-phone','client-address']
                .forEach(id => document.getElementById(id).value = '');
        }
    },

    edit(id) { App.navigate('clients'); setTimeout(() => this.openModal(id), 100); },

    closeModal() { document.getElementById('client-modal').style.display = 'none'; },

    save() {
        const name = document.getElementById('client-name').value.trim();
        if (!name) { alert('Client name is required.'); return; }
        const id = document.getElementById('client-id').value || DB.uid();
        const client = {
            id,
            name,
            company: document.getElementById('client-company').value.trim(),
            email: document.getElementById('client-email').value.trim(),
            phone: document.getElementById('client-phone').value.trim(),
            address: document.getElementById('client-address').value.trim(),
            createdAt: new Date().toISOString(),
        };
        DB.save('clients', client);
        this.closeModal();
        App.navigate('clients');
    },

    delete(id) {
        if (confirm('Are you sure you want to delete this client? Their invoices will remain.')) {
            DB.delete('clients', id);
            App.navigate('clients');
        }
    }
};
