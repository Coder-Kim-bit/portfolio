/**
 * NexusMarket - Shopping Cart & Wishlist State Manager
 */

import { KES_EXCHANGE_RATE } from './data.js';

let cartItems = JSON.parse(localStorage.getItem('NEXUS_CART') || '[]');
let wishlist = JSON.parse(localStorage.getItem('NEXUS_WISHLIST') || '[]');
let promoDiscount = 0; // percentage e.g. 20 for 20%

export function getCartItems() {
  return cartItems;
}

export function addToCart(product) {
  const existing = cartItems.find(item => item.id === product.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cartItems.push({ ...product, quantity: 1 });
  }
  saveCart();
}

export function removeFromCart(productId) {
  cartItems = cartItems.filter(item => item.id !== productId);
  saveCart();
}

export function updateQuantity(productId, quantity) {
  if (quantity <= 0) {
    removeFromCart(productId);
    return;
  }
  const item = cartItems.find(i => i.id === productId);
  if (item) {
    item.quantity = quantity;
    saveCart();
  }
}

export function clearCart() {
  cartItems = [];
  promoDiscount = 0;
  saveCart();
}

export function applyPromoCode(code) {
  if (code.toUpperCase().trim() === 'NEXUS20') {
    promoDiscount = 20;
    return { success: true, discountPercent: 20, message: '20% Promo Discount Applied!' };
  }
  return { success: false, message: 'Invalid promo code. Try "NEXUS20"' };
}

export function getCartTotals() {
  const subtotalUSD = cartItems.reduce((acc, item) => acc + (item.priceUSD * item.quantity), 0);
  const discountUSD = (subtotalUSD * promoDiscount) / 100;
  const taxableUSD = subtotalUSD - discountUSD;
  const taxUSD = taxableUSD * 0.08; // 8% digital VAT tax
  const totalUSD = taxableUSD + taxUSD;

  return {
    subtotalUSD: subtotalUSD.toFixed(2),
    subtotalKES: Math.round(subtotalUSD * KES_EXCHANGE_RATE).toLocaleString(),
    discountUSD: discountUSD.toFixed(2),
    taxUSD: taxUSD.toFixed(2),
    totalUSD: totalUSD.toFixed(2),
    totalKES: Math.round(totalUSD * KES_EXCHANGE_RATE).toLocaleString(),
    itemCount: cartItems.reduce((acc, item) => acc + item.quantity, 0)
  };
}

export function toggleWishlist(productId) {
  if (wishlist.includes(productId)) {
    wishlist = wishlist.filter(id => id !== productId);
  } else {
    wishlist.push(productId);
  }
  localStorage.setItem('NEXUS_WISHLIST', JSON.stringify(wishlist));
  return wishlist.includes(productId);
}

export function isWishlisted(productId) {
  return wishlist.includes(productId);
}

export function getWishlistCount() {
  return wishlist.length;
}

function saveCart() {
  localStorage.setItem('NEXUS_CART', JSON.stringify(cartItems));
}
