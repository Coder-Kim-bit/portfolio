// =============================================
// storage.js — localStorage CRUD helpers
// =============================================

const DB = {
    // Keys
    KEYS: {
        invoices: 'fh_invoices',
        clients: 'fh_clients',
        income: 'fh_income',
        expenses: 'fh_expenses',
        settings: 'fh_settings',
    },

    get(key) {
        try {
            return JSON.parse(localStorage.getItem(key)) || [];
        } catch { return []; }
    },

    getObj(key) {
        try {
            return JSON.parse(localStorage.getItem(key)) || {};
        } catch { return {}; }
    },

    set(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    },

    // Generic CRUD
    getAll(entity) { return this.get(this.KEYS[entity]); },

    getById(entity, id) {
        return this.getAll(entity).find(item => item.id === id) || null;
    },

    save(entity, item) {
        const items = this.getAll(entity);
        const idx = items.findIndex(i => i.id === item.id);
        if (idx >= 0) items[idx] = item;
        else items.push(item);
        this.set(this.KEYS[entity], items);
        return item;
    },

    delete(entity, id) {
        const items = this.getAll(entity).filter(i => i.id !== id);
        this.set(this.KEYS[entity], items);
    },

    getSettings() { return this.getObj(this.KEYS.settings); },
    saveSettings(settings) { this.set(this.KEYS.settings, settings); },

    // Seed demo data for first-time users
    seedIfEmpty() {
        if (this.getAll('clients').length === 0) {
            const demoClients = [
                { id: 'c1', name: 'Acme Corp Ltd', email: 'billing@acme.co.ke', phone: '0700000001', company: 'Acme Corp Ltd', address: 'Nairobi CBD', createdAt: new Date().toISOString() },
                { id: 'c2', name: 'Savanna Digital', email: 'info@savanna.co.ke', phone: '0722000002', company: 'Savanna Digital', address: 'Westlands, Nairobi', createdAt: new Date().toISOString() },
            ];
            this.set(this.KEYS.clients, demoClients);
        }

        if (this.getAll('invoices').length === 0) {
            const demoInvoices = [
                {
                    id: 'INV-001', number: 'INV-001', clientId: 'c1', clientName: 'Acme Corp Ltd',
                    status: 'paid', date: '2026-06-01', dueDate: '2026-06-15',
                    items: [{ description: 'Website Design', qty: 1, rate: 85000, amount: 85000 }],
                    subtotal: 85000, tax: 0, total: 85000, notes: 'Thank you for your business!',
                    createdAt: new Date().toISOString()
                },
                {
                    id: 'INV-002', number: 'INV-002', clientId: 'c2', clientName: 'Savanna Digital',
                    status: 'sent', date: '2026-07-01', dueDate: '2026-07-15',
                    items: [
                        { description: 'Brand Identity Design', qty: 1, rate: 45000, amount: 45000 },
                        { description: 'Social Media Templates', qty: 5, rate: 3000, amount: 15000 },
                    ],
                    subtotal: 60000, tax: 0, total: 60000, notes: 'Payment via M-Pesa Paybill: 123456',
                    createdAt: new Date().toISOString()
                },
            ];
            this.set(this.KEYS.invoices, demoInvoices);
        }

        if (this.getAll('income').length === 0) {
            const demoIncome = [
                { id: 'inc1', date: '2026-06-01', amount: 85000, source: 'Acme Corp Ltd', description: 'Website Design Payment', method: 'M-Pesa', createdAt: new Date().toISOString() },
                { id: 'inc2', date: '2026-06-15', amount: 30000, source: 'Freelance Project', description: 'Logo Design - Retail Client', method: 'Bank Transfer', createdAt: new Date().toISOString() },
                { id: 'inc3', date: '2026-07-01', amount: 22000, source: 'Consulting', description: 'IT Consulting Session', method: 'M-Pesa', createdAt: new Date().toISOString() },
            ];
            this.set(this.KEYS.income, demoIncome);
        }

        if (this.getAll('expenses').length === 0) {
            const demoExpenses = [
                { id: 'exp1', date: '2026-06-05', amount: 5000, category: 'Internet', description: 'Monthly Fibre Bill', createdAt: new Date().toISOString() },
                { id: 'exp2', date: '2026-06-10', amount: 12000, category: 'Equipment', description: 'External Hard Drive', createdAt: new Date().toISOString() },
                { id: 'exp3', date: '2026-07-02', amount: 3500, category: 'Transport', description: 'Client Meetings - Nairobi', createdAt: new Date().toISOString() },
            ];
            this.set(this.KEYS.expenses, demoExpenses);
        }

        if (!this.getSettings().businessName) {
            this.saveSettings({
                businessName: 'My Freelance Business',
                ownerName: 'Your Name',
                email: 'hello@myfreelance.co.ke',
                phone: '0700000000',
                address: 'Nairobi, Kenya',
                kraPin: '',
                currency: 'KES',
                taxType: 'TOT',
                vatRegistered: false,
            });
        }
    },

    // Generate next invoice number
    nextInvoiceNumber() {
        const invoices = this.getAll('invoices');
        if (invoices.length === 0) return 'INV-001';
        const nums = invoices.map(inv => parseInt((inv.number || 'INV-000').split('-')[1]) || 0);
        const max = Math.max(...nums);
        return `INV-${String(max + 1).padStart(3, '0')}`;
    },

    uid() { return Date.now().toString(36) + Math.random().toString(36).substr(2, 5); }
};
