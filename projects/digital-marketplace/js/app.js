/**
 * NexusMarket - Main UI & Controller (With Live Code Inspector & Sales Analytics)
 */

import { PRODUCTS, CATEGORIES, KES_EXCHANGE_RATE } from './data.js';
import { 
  addToCart, 
  removeFromCart, 
  getCartItems, 
  getCartTotals, 
  applyPromoCode, 
  toggleWishlist, 
  isWishlisted, 
  getWishlistCount 
} from './cart.js';
import { processMpesaPayment, processPaypalPayment, processCardPayment, getSalesLedger } from './payment.js';
import { getOwnerConfig, saveOwnerConfig } from './ownerConfig.js';

let activeCategory = 'all';
let searchQuery = '';
let selectedPaymentMethod = 'mpesa';
let currentProductsList = [...PRODUCTS];

let currentPage = 1;
const pageSize = 12;

document.addEventListener('DOMContentLoaded', () => {
  initIcons();
  renderCategories();
  renderProducts();
  initSearchAndFilters();
  initCartDrawer();
  initCheckoutModal();
  initProductQuickView();
  initSellerAdmin();
  initOwnerSettingsModal();
  updateCartBadge();
  updateWishlistBadge();
});

function initIcons() {
  if (window.lucide) window.lucide.createIcons();
}

function renderCategories() {
  const container = document.getElementById('category-tags');
  if (!container) return;

  container.innerHTML = '';
  CATEGORIES.forEach(cat => {
    const chip = document.createElement('span');
    chip.className = `tag-chip ${cat.id === activeCategory ? 'active' : ''}`;
    chip.textContent = cat.name;
    chip.addEventListener('click', () => {
      activeCategory = cat.id;
      currentPage = 1;
      document.querySelectorAll('.tag-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      renderProducts();
    });
    container.appendChild(chip);
  });
}

function renderProducts() {
  const container = document.getElementById('product-grid');
  const countEl = document.getElementById('catalog-count-text');
  const paginationContainer = document.getElementById('pagination-controls');

  if (!container) return;

  let filtered = currentProductsList.filter(prod => {
    const matchCat = activeCategory === 'all' || prod.category === activeCategory;
    const matchSearch = searchQuery === '' || 
      prod.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      prod.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const totalFiltered = filtered.length;
  const totalPages = Math.ceil(totalFiltered / pageSize) || 1;
  if (currentPage > totalPages) currentPage = 1;

  const startIndex = (currentPage - 1) * pageSize;
  const pageItems = filtered.slice(startIndex, startIndex + pageSize);

  if (countEl) {
    countEl.textContent = `Showing ${startIndex + 1}-${Math.min(startIndex + pageSize, totalFiltered)} of ${totalFiltered.toLocaleString()} worldwide products`;
  }

  container.innerHTML = '';
  if (pageItems.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 60px; color: var(--text-dim);">
        <i data-lucide="package-search" style="width: 48px; height: 48px; margin-bottom: 12px;"></i>
        <h3>No products match your search</h3>
        <p style="font-size: 13px; margin-top: 4px;">Try searching for different keywords or category.</p>
      </div>
    `;
    if (paginationContainer) paginationContainer.innerHTML = '';
    initIcons();
    return;
  }

  pageItems.forEach(product => {
    const isFav = isWishlisted(product.id);
    const kesPrice = Math.round(product.priceUSD * KES_EXCHANGE_RATE).toLocaleString();

    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <div class="product-thumb">
        <img src="${product.image}" alt="${product.name}" />
        <span class="badge-category">${product.categoryName}</span>
        <button class="wishlist-btn ${isFav ? 'active' : ''}" data-id="${product.id}" title="Bookmark Product">
          <i data-lucide="heart" style="width: 16px; height: 16px; ${isFav ? 'fill: var(--accent-rose);' : ''}"></i>
        </button>
      </div>
      <div class="product-body">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
          <span style="font-size: 10px; font-weight: 700; color: var(--primary); text-transform: uppercase; letter-spacing: 0.5px;">${product.badge || 'Featured'}</span>
          <span style="font-size: 10px; color: var(--text-dim); font-family: var(--font-mono);">${product.seller}</span>
        </div>
        <h3 class="product-title">${product.name}</h3>
        <p class="product-desc">${product.description}</p>

        <div style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--accent-amber); margin-bottom: 12px;">
          <i data-lucide="star" style="width: 14px; height: 14px; fill: var(--accent-amber);"></i>
          <span style="font-weight: 600;">${product.rating}</span>
          <span style="color: var(--text-dim);">(${product.reviewsCount} reviews)</span>
        </div>

        <div class="product-footer">
          <div class="price-box">
            <span class="price-usd">$${product.priceUSD}</span>
            <span class="price-kes">~ KSh ${kesPrice}</span>
          </div>
          <button class="btn-add-cart" data-id="${product.id}">
            <i data-lucide="code" style="width: 15px; height: 15px;"></i> Preview & Add
          </button>
        </div>
      </div>
    `;

    card.querySelector('.wishlist-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      toggleWishlist(product.id);
      renderProducts();
      updateWishlistBadge();
    });

    card.querySelector('.btn-add-cart').addEventListener('click', (e) => {
      e.stopPropagation();
      openQuickViewModal(product);
    });

    card.addEventListener('click', () => openQuickViewModal(product));

    container.appendChild(card);
  });

  renderPagination(totalPages, paginationContainer);
  initIcons();
}

function renderPagination(totalPages, container) {
  if (!container) return;
  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; gap: 12px; margin-top: 36px;">
      <button class="nav-btn ${currentPage === 1 ? 'disabled' : ''}" id="btn-prev-page" ${currentPage === 1 ? 'disabled' : ''}>
        <i data-lucide="chevron-left"></i> Previous
      </button>
      <span style="font-size: 14px; font-weight: 600; color: var(--text-muted); font-family: var(--font-mono);">
        Page <strong style="color: var(--primary);">${currentPage}</strong> of ${totalPages}
      </span>
      <button class="nav-btn ${currentPage === totalPages ? 'disabled' : ''}" id="btn-next-page" ${currentPage === totalPages ? 'disabled' : ''}>
        Next <i data-lucide="chevron-right"></i>
      </button>
    </div>
  `;

  document.getElementById('btn-prev-page')?.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      renderProducts();
      window.scrollTo({ top: 400, behavior: 'smooth' });
    }
  });

  document.getElementById('btn-next-page')?.addEventListener('click', () => {
    if (currentPage < totalPages) {
      currentPage++;
      renderProducts();
      window.scrollTo({ top: 400, behavior: 'smooth' });
    }
  });
}

function initSearchAndFilters() {
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim();
      currentPage = 1;
      renderProducts();
    });
  }
}

// Cart Drawer
function initCartDrawer() {
  const drawerOverlay = document.getElementById('cart-drawer-overlay');
  const btnOpenCart = document.getElementById('btn-open-cart');
  const btnCloseCart = document.getElementById('btn-close-cart');
  const btnCheckout = document.getElementById('btn-cart-checkout');
  const btnApplyPromo = document.getElementById('btn-apply-promo');
  const promoInput = document.getElementById('promo-input');

  if (btnOpenCart) btnOpenCart.addEventListener('click', () => openCartDrawer());
  if (btnCloseCart) btnCloseCart.addEventListener('click', () => closeCartDrawer());
  if (drawerOverlay) {
    drawerOverlay.addEventListener('click', (e) => {
      if (e.target === drawerOverlay) closeCartDrawer();
    });
  }

  if (btnCheckout) {
    btnCheckout.addEventListener('click', () => {
      const items = getCartItems();
      if (items.length === 0) return alert('Your shopping cart is empty.');
      closeCartDrawer();
      openCheckoutModal();
    });
  }

  if (btnApplyPromo && promoInput) {
    btnApplyPromo.addEventListener('click', () => {
      const res = applyPromoCode(promoInput.value);
      alert(res.message);
      renderCartDrawerItems();
    });
  }
}

function openCartDrawer() {
  const drawerOverlay = document.getElementById('cart-drawer-overlay');
  if (drawerOverlay) {
    renderCartDrawerItems();
    drawerOverlay.classList.add('active');
  }
}

function closeCartDrawer() {
  const drawerOverlay = document.getElementById('cart-drawer-overlay');
  if (drawerOverlay) drawerOverlay.classList.remove('active');
}

function renderCartDrawerItems() {
  const container = document.getElementById('cart-items-list');
  if (!container) return;

  const items = getCartItems();
  const totals = getCartTotals();

  if (items.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; color: var(--text-dim); margin-top: 80px;">
        <i data-lucide="shopping-bag" style="width: 48px; height: 48px; opacity: 0.3; margin-bottom: 12px;"></i>
        <p>Your shopping cart is empty</p>
      </div>
    `;
  } else {
    container.innerHTML = '';
    items.forEach(item => {
      const itemEl = document.createElement('div');
      itemEl.className = 'cart-item';
      itemEl.innerHTML = `
        <img class="cart-item-thumb" src="${item.image}" alt="${item.name}" />
        <div class="cart-item-info">
          <div class="cart-item-title">${item.name}</div>
          <div class="cart-item-price">$${item.priceUSD} x ${item.quantity} (~ KSh ${Math.round(item.priceUSD * item.quantity * KES_EXCHANGE_RATE).toLocaleString()})</div>
        </div>
        <button class="btn-remove-item" data-id="${item.id}" title="Remove item">
          <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
        </button>
      `;

      itemEl.querySelector('.btn-remove-item').addEventListener('click', () => {
        removeFromCart(item.id);
        renderCartDrawerItems();
        updateCartBadge();
      });

      container.appendChild(itemEl);
    });
  }

  document.getElementById('cart-subtotal-usd').textContent = `$${totals.subtotalUSD}`;
  document.getElementById('cart-subtotal-kes').textContent = `KSh ${totals.subtotalKES}`;
  document.getElementById('cart-tax-usd').textContent = `$${totals.taxUSD}`;
  document.getElementById('cart-total-usd').textContent = `$${totals.totalUSD}`;
  document.getElementById('cart-total-kes').textContent = `KSh ${totals.totalKES}`;

  initIcons();
}

function updateCartBadge() {
  const totals = getCartTotals();
  const badge = document.getElementById('cart-badge-count');
  if (badge) badge.textContent = totals.itemCount;
}

function updateWishlistBadge() {
  const badge = document.getElementById('wishlist-badge-count');
  if (badge) badge.textContent = getWishlistCount();
}

// Multi-Payment Checkout Modal Init
function initCheckoutModal() {
  const modalOverlay = document.getElementById('checkout-modal-overlay');
  const btnClose = document.getElementById('btn-close-checkout');
  const payTabs = document.querySelectorAll('.pay-tab');
  const mpesaBox = document.getElementById('pay-box-mpesa');
  const paypalBox = document.getElementById('pay-box-paypal');
  const cardBox = document.getElementById('pay-box-card');
  const cryptoBox = document.getElementById('pay-box-crypto');

  if (btnClose && modalOverlay) {
    btnClose.addEventListener('click', () => modalOverlay.classList.remove('active'));
  }

  payTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      selectedPaymentMethod = tab.getAttribute('data-method');
      payTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      [mpesaBox, paypalBox, cardBox, cryptoBox].forEach(b => {
        if (b) b.style.display = 'none';
      });

      if (selectedPaymentMethod === 'mpesa' && mpesaBox) mpesaBox.style.display = 'block';
      if (selectedPaymentMethod === 'paypal' && paypalBox) paypalBox.style.display = 'block';
      if (selectedPaymentMethod === 'card' && cardBox) cardBox.style.display = 'block';
      if (selectedPaymentMethod === 'crypto' && cryptoBox) cryptoBox.style.display = 'block';
    });
  });

  const btnSubmitMpesa = document.getElementById('btn-submit-mpesa');
  const mpesaPhoneInput = document.getElementById('mpesa-phone');
  const mpesaStatusLog = document.getElementById('mpesa-status-log');

  if (btnSubmitMpesa && mpesaPhoneInput) {
    btnSubmitMpesa.addEventListener('click', async () => {
      const phone = mpesaPhoneInput.value.trim();
      if (!phone) return alert('Please enter your M-Pesa phone number.');

      btnSubmitMpesa.disabled = true;
      mpesaStatusLog.style.display = 'block';

      try {
        await processMpesaPayment(phone, (progress) => {
          mpesaStatusLog.innerHTML = `
            <div style="font-size: 13px; color: var(--accent-mpesa); padding: 12px; background: rgba(16, 185, 129, 0.1); border-radius: 8px;">
              <strong>${progress.message}</strong>
            </div>
          `;
          if (progress.receipt) renderReceiptScreen(progress.receipt);
        });
      } catch (err) {
        alert(err.message);
        btnSubmitMpesa.disabled = false;
        mpesaStatusLog.style.display = 'none';
      }
    });
  }

  const btnSubmitPaypal = document.getElementById('btn-submit-paypal');
  const paypalEmailInput = document.getElementById('paypal-email');

  if (btnSubmitPaypal) {
    btnSubmitPaypal.addEventListener('click', async () => {
      const email = paypalEmailInput.value.trim() || 'buyer@paypal.com';
      btnSubmitPaypal.disabled = true;
      await processPaypalPayment(email, (progress) => {
        if (progress.receipt) renderReceiptScreen(progress.receipt);
      });
    });
  }

  const btnSubmitCard = document.getElementById('btn-submit-card');
  if (btnSubmitCard) {
    btnSubmitCard.addEventListener('click', async () => {
      const cardNum = document.getElementById('card-num')?.value;
      try {
        await processCardPayment({ number: cardNum }, (progress) => {
          if (progress.receipt) renderReceiptScreen(progress.receipt);
        });
      } catch (e) {
        alert(e.message);
      }
    });
  }
}

function openCheckoutModal() {
  const modalOverlay = document.getElementById('checkout-modal-overlay');
  const totals = getCartTotals();

  if (modalOverlay) {
    document.getElementById('checkout-total-display').textContent = `$${totals.totalUSD} (~ KSh ${totals.totalKES})`;
    document.getElementById('receipt-container').style.display = 'none';
    document.getElementById('checkout-form-container').style.display = 'block';
    modalOverlay.classList.add('active');
  }
}

function renderReceiptScreen(receipt) {
  const formContainer = document.getElementById('checkout-form-container');
  const receiptContainer = document.getElementById('receipt-container');

  if (formContainer && receiptContainer) {
    formContainer.style.display = 'none';
    receiptContainer.style.display = 'block';

    let itemsListHtml = receipt.items.map(item => `
      <div style="display: flex; justify-content: space-between; font-size: 13px; padding: 6px 0; border-bottom: 1px dashed var(--border-subtle);">
        <span>${item.name}</span>
        <span style="font-family: var(--font-mono); color: var(--primary);">$${item.priceUSD}</span>
      </div>
    `).join('');

    receiptContainer.innerHTML = `
      <div class="receipt-box">
        <div class="receipt-icon"><i data-lucide="check-circle-2" style="width: 36px; height: 36px;"></i></div>
        <h3 style="font-family: var(--font-heading); font-size: 22px; font-weight: 700; margin-bottom: 6px;">Payment Successful!</h3>
        <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 20px;">
          Thank you! Your funds have been routed to the store owner account.
        </p>

        <div style="background: rgba(15, 23, 42, 0.8); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 16px; text-align: left; margin-bottom: 20px;">
          <div style="font-size: 11px; color: var(--text-dim); text-transform: uppercase;">Payment Route</div>
          <div style="font-size: 14px; font-weight: 600; color: var(--accent-mpesa); margin-bottom: 10px;">${receipt.channel}</div>
          <div style="font-size: 12px; font-family: var(--font-mono); color: var(--text-muted); margin-bottom: 12px;">Ref Code: ${receipt.transactionId}</div>
          
          ${itemsListHtml}

          <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: 700; margin-top: 12px; padding-top: 8px; border-top: 1px solid var(--border-medium);">
            <span>Total Paid</span>
            <span style="color: var(--primary);">${receipt.amountUSD} (${receipt.amountKES || ''})</span>
          </div>
        </div>

        <button class="btn-checkout-submit btn-mpesa" id="btn-download-assets">
          <i data-lucide="download"></i> Download Digital Files (.ZIP)
        </button>
      </div>
    `;

    initIcons();
    updateCartBadge();
    renderOwnerSalesLedger();

    document.getElementById('btn-download-assets')?.addEventListener('click', () => {
      alert('Downloading product license & source code files archive (.zip)...');
    });
  }
}

// Store Owner Sales Ledger & Settings Modal
function initOwnerSettingsModal() {
  const btnOpen = document.getElementById('btn-owner-settings');
  const modal = document.getElementById('owner-modal-overlay');
  const btnClose = document.getElementById('btn-close-owner');
  const formOwner = document.getElementById('form-owner-config');

  if (btnOpen && modal) {
    btnOpen.addEventListener('click', () => {
      const cfg = getOwnerConfig();
      document.getElementById('owner-paybill').value = cfg.mpesa.paybillNumber || '';
      document.getElementById('owner-paypal-email').value = cfg.paypal.merchantEmail || '';
      document.getElementById('owner-stripe-key').value = cfg.stripe.publishableKey || '';
      renderOwnerSalesLedger();
      modal.classList.add('active');
    });
  }

  if (btnClose && modal) {
    btnClose.addEventListener('click', () => modal.classList.remove('active'));
  }

  if (formOwner) {
    formOwner.addEventListener('submit', (e) => {
      e.preventDefault();
      const cfg = getOwnerConfig();
      cfg.mpesa.paybillNumber = document.getElementById('owner-paybill').value.trim();
      cfg.paypal.merchantEmail = document.getElementById('owner-paypal-email').value.trim();
      cfg.stripe.publishableKey = document.getElementById('owner-stripe-key').value.trim();

      saveOwnerConfig(cfg);
      modal.classList.remove('active');
      alert(`Store Owner Credentials Saved!\n- M-Pesa Paybill/Till: ${cfg.mpesa.paybillNumber}\n- PayPal Email: ${cfg.paypal.merchantEmail}`);
    });
  }
}

function renderOwnerSalesLedger() {
  const ledgerEl = document.getElementById('owner-sales-ledger-list');
  const totalRevUSD = document.getElementById('owner-total-usd');
  const totalRevKES = document.getElementById('owner-total-kes');
  const totalOrdersEl = document.getElementById('owner-total-orders');

  if (!ledgerEl) return;

  const ledger = getSalesLedger();

  let sumUSD = 0;
  let sumKES = 0;

  if (ledger.length === 0) {
    ledgerEl.innerHTML = `
      <div style="text-align: center; color: var(--text-dim); padding: 24px;">
        <i data-lucide="receipt" style="width: 32px; height: 32px; opacity: 0.3; margin-bottom: 8px;"></i>
        <p style="font-size: 13px;">No customer transactions recorded yet.</p>
        <span style="font-size: 11px;">Completed customer purchases will appear here in real time.</span>
      </div>
    `;
  } else {
    ledgerEl.innerHTML = '';
    ledger.forEach(sale => {
      sumUSD += (sale.rawUSD || 0);
      sumKES += (sale.rawKES || 0);

      const row = document.createElement('div');
      row.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; background: rgba(30, 41, 59, 0.4); border: 1px solid var(--border-subtle); border-radius: 8px; margin-bottom: 8px; font-size: 12px;';
      row.innerHTML = `
        <div>
          <div style="font-weight: 600; color: #fff;">${sale.channel} (${sale.customerDetail})</div>
          <div style="font-family: var(--font-mono); color: var(--text-dim); font-size: 11px;">Ref: ${sale.transactionId} • ${sale.timestamp}</div>
        </div>
        <div style="text-align: right;">
          <div style="font-family: var(--font-mono); font-weight: 700; color: var(--accent-mpesa);">${sale.amountUSD}</div>
          <div style="font-size: 10px; color: var(--text-dim);">${sale.amountKES || ''}</div>
        </div>
      `;
      ledgerEl.appendChild(row);
    });
  }

  if (totalRevUSD) totalRevUSD.textContent = `$${sumUSD.toFixed(2)}`;
  if (totalRevKES) totalRevKES.textContent = `KSh ${Math.round(sumKES).toLocaleString()}`;
  if (totalOrdersEl) totalOrdersEl.textContent = ledger.length;

  initIcons();
}

// QUICK VIEW MODAL WITH LIVE CODE INSPECTOR
function initProductQuickView() {}

function openQuickViewModal(product) {
  const modal = document.getElementById('quickview-modal-overlay');
  const content = document.getElementById('quickview-content');
  if (!modal || !content) return;

  const kesPrice = Math.round(product.priceUSD * KES_EXCHANGE_RATE).toLocaleString();

  // Code Snippet Sample Generator based on Product Category
  const codeFiles = generateCodePreviewFiles(product);
  let activeFileName = Object.keys(codeFiles)[0];

  function renderInspectorView() {
    let fileTreeHtml = Object.keys(codeFiles).map(fileName => `
      <div class="file-tree-item ${fileName === activeFileName ? 'active' : ''}" data-filename="${fileName}">
        <i data-lucide="${fileName.endsWith('.py') || fileName.endsWith('.js') ? 'file-code' : 'file-text'}" style="width: 14px; height: 14px;"></i>
        <span>${fileName}</span>
      </div>
    `).join('');

    content.innerHTML = `
      <div>
        <div style="display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 12px;">
          <div>
            <span class="badge-category">${product.categoryName}</span>
            <h3 style="font-family: var(--font-heading); font-size: 22px; font-weight: 700; margin-top: 4px;">${product.name}</h3>
            <span style="font-size: 12px; color: var(--text-dim); font-family: var(--font-mono);">By ${product.seller} • Verified Source License</span>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 22px; font-weight: 800; color: var(--primary);">$${product.priceUSD}</div>
            <div style="font-size: 11px; font-family: var(--font-mono); color: var(--text-dim);">~ KSh ${kesPrice}</div>
          </div>
        </div>

        <p style="font-size: 13px; color: var(--text-muted); line-height: 1.5; margin-bottom: 12px;">${product.description}</p>

        <!-- Live Code Inspector Section -->
        <h4 style="font-size: 12px; font-weight: 700; color: var(--primary); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
          <i data-lucide="code" style="width: 14px; height: 14px; display: inline-block; vertical-align: middle;"></i> Live Source Code & Specs Inspector
        </h4>

        <div class="code-inspector-container">
          <div class="file-tree-sidebar">
            <div style="font-size: 10px; font-weight: 700; color: var(--text-dim); text-transform: uppercase; padding: 4px 6px;">File Explorer</div>
            ${fileTreeHtml}
          </div>
          <div class="code-viewer-panel">
            <div class="code-viewer-header">
              <span>📄 ${activeFileName}</span>
              <button style="background: transparent; border: none; color: var(--primary); font-size: 11px; cursor: pointer;" id="btn-copy-code"><i data-lucide="copy" style="width: 12px; height: 12px;"></i> Copy Code</button>
            </div>
            <pre class="code-block-content">${escapeHtml(codeFiles[activeFileName])}</pre>
          </div>
        </div>

        <!-- Action Footer -->
        <div style="display: flex; gap: 12px; margin-top: 16px;">
          <button class="btn-add-cart" id="quick-add-cart" style="flex: 1; padding: 12px; justify-content: center; font-size: 14px;">
            <i data-lucide="shopping-cart"></i> Add to Cart ($${product.priceUSD})
          </button>
          <button class="btn-checkout-submit btn-mpesa" id="quick-buy-now" style="flex: 1; padding: 12px; font-size: 14px;">
            <i data-lucide="smartphone"></i> Buy Now with M-Pesa
          </button>
        </div>
      </div>
    `;

    // File Switcher Click Event
    content.querySelectorAll('.file-tree-item').forEach(item => {
      item.addEventListener('click', () => {
        activeFileName = item.getAttribute('data-filename');
        renderInspectorView();
      });
    });

    document.getElementById('btn-copy-code')?.addEventListener('click', () => {
      navigator.clipboard.writeText(codeFiles[activeFileName]);
      alert(`Copied ${activeFileName} content to clipboard!`);
    });

    document.getElementById('quick-add-cart')?.addEventListener('click', () => {
      addToCart(product);
      updateCartBadge();
      modal.classList.remove('active');
      openCartDrawer();
    });

    document.getElementById('quick-buy-now')?.addEventListener('click', () => {
      addToCart(product);
      updateCartBadge();
      modal.classList.remove('active');
      openCheckoutModal();
    });

    initIcons();
  }

  renderInspectorView();
  modal.classList.add('active');
  document.getElementById('btn-close-quickview')?.addEventListener('click', () => modal.classList.remove('active'));
}

// Generate Realistic Code Previews per category
function generateCodePreviewFiles(product) {
  if (product.category === 'ai-models') {
    return {
      'main.py': `# ${product.name}\nimport google.genai as genai\n\ndef initialize_agent():\n    client = genai.Client()\n    response = client.models.generate_content(\n        model="gemini-2.5-flash",\n        contents="Execute multi-step workflow with tools"\n    )\n    return response.text\n\nif __name__ == '__main__':\n    print(initialize_agent())`,
      'config.json': `{\n  "model": "gemini-2.5-flash",\n  "temperature": 0.2,\n  "tools": ["web_search", "python_interpreter", "rag_store"],\n  "max_tokens": 2048\n}`,
      'README.md': `# ${product.name}\n\nProduction-ready agent orchestration framework.\n- Supported Models: Gemini 2.5 Flash / Pro\n- Verified License: MIT Commercial`
    };
  } else if (product.category === 'dev-tools') {
    return {
      'stk_push.py': `# M-Pesa STK Push Express SDK\nimport requests\nfrom datetime import datetime\n\ndef trigger_stk_push(phone, amount, paybill):\n    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')\n    payload = {\n        "BusinessShortCode": paybill,\n        "Amount": amount,\n        "PartyA": phone,\n        "PhoneNumber": phone,\n        "CallBackURL": "https://api.yourdomain.com/mpesa/callback"\n    }\n    print(f"STK Push dispatched to {phone} for KSh {amount}")\n    return {"status": "200", "CheckoutRequestID": "ws_CO_12948"}`,
      'package.json': `{\n  "name": "mpesa-stk-express",\n  "version": "2.5.0",\n  "description": "Daraja 2.0 API Wrapper",\n  "main": "stk_push.py"\n}`
    };
  } else {
    return {
      'App.tsx': `import React from 'react';\nimport { GlassCard } from './components';\n\nexport const SaaSView = () => (\n  <GlassCard title="${product.name}">\n    <p>Modern Luminous UI Component</p>\n  </GlassCard>\n);`,
      'styles.css': `:root {\n  --glass-bg: rgba(15, 23, 42, 0.75);\n  --accent-neon: #06b6d4;\n}`
    };
  }
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function initSellerAdmin() {
  const btnOpenSeller = document.getElementById('btn-open-seller');
  const modalSeller = document.getElementById('seller-modal-overlay');
  const btnCloseSeller = document.getElementById('btn-close-seller');
  const formPublish = document.getElementById('form-publish-product');

  if (btnOpenSeller && modalSeller) {
    btnOpenSeller.addEventListener('click', () => {
      renderOwnerSalesLedger();
      modalSeller.classList.add('active');
    });
  }
  if (btnCloseSeller && modalSeller) {
    btnCloseSeller.addEventListener('click', () => modalSeller.classList.remove('active'));
  }

  if (formPublish) {
    formPublish.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('new-prod-name').value;
      const priceUSD = parseFloat(document.getElementById('new-prod-price').value);
      const category = document.getElementById('new-prod-cat').value;
      const desc = document.getElementById('new-prod-desc').value;

      const newProd = {
        id: `prod-${Date.now()}`,
        name,
        category,
        categoryName: CATEGORIES.find(c => c.id === category)?.name || 'Digital Item',
        priceUSD,
        rating: 5.0,
        reviewsCount: 1,
        badge: 'New Release',
        image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80',
        description: desc,
        seller: 'Onesmus Kimutai'
      };

      currentProductsList.unshift(newProd);
      currentPage = 1;
      renderProducts();
      modalSeller.classList.remove('active');
      alert(`Product "${name}" published successfully to NexusMarket!`);
    });
  }
}
