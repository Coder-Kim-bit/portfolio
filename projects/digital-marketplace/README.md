# 🛒 NexusMarket - Digital E-Commerce & Asset Marketplace

NexusMarket is a state-of-the-art E-Commerce platform for digital products, AI models, developer libraries, UI design systems, and Python scripts with built-in **M-Pesa STK Push Express**, **PayPal**, **Credit Card**, and **Crypto** payment integration.

![Theme](https://img.shields.io/badge/Theme-Luminous%20Dark%20Glassmorphism-06b6d4?style=for-the-badge)
![Payments](https://img.shields.io/badge/Payments-M--Pesa%20%7C%20PayPal%20%7C%20Cards-10b981?style=for-the-badge)
![Currency](https://img.shields.io/badge/Currency-USD%20%26%20KES-8b5cf6?style=for-the-badge)

---

## ✨ Key Features

- **📱 Multi-Payment Gateway**:
  - **M-Pesa Express (STK Push)**: Real-time mobile STK Push prompt simulator, transaction ID generator (`QGH89X2...`), and instant callback receipt.
  - **PayPal Express**: One-touch account authorization.
  - **Credit / Debit Cards**: Card validation with Stripe-style checkout.
  - **Crypto / Web3 Pay**: USDT QR code wallet payload processor.
- **💱 Dual Currency Display**: Real-time conversion between **USD ($)** and **KES (KSh)** (1 USD = 130 KES).
- **🛍️ Interactive Shopping Cart Drawer**: Instant quantity adjusters, tax calculation, and promo code support (`NEXUS20` for 20% off).
- **🔍 Instant Search & Category Filtering**: Filter across AI Models, Developer Tools, UI Kits, Python Scripts, and Web Templates.
- **❤️ Wishlist Bookmarks**: Persistent item favorites system.
- **📦 Seller Admin Studio**: Publish new digital products to the live catalog.
- **⚡ Instant File Delivery**: Automated digital receipt & `.ZIP` download trigger.

---

## 🚀 Quick Start

### 1. Launch Dev Server
Ensure Python 3 is installed, then run:

```bash
python server.py
```

### 2. Open Storefront
Navigate to **`http://localhost:8001`** in your browser.

---

## 📁 Repository Structure

```text
digital-marketplace/
├── index.html          # Storefront HTML5 Glass Shell
├── styles.css          # Luminous Dark Glassmorphism Design System
├── server.py           # HTTP Dev Server
├── js/
│   ├── app.js          # Main UI Controller & View Handler
│   ├── cart.js         # Cart State, Tax & Wishlist Manager
│   ├── data.js         # Product Catalog & Exchange Rate Dataset
│   └── payment.js      # M-Pesa STK Push, PayPal & Card Engine
├── .gitignore
└── README.md
```

---

## 📜 License
Licensed under the [MIT License](LICENSE).
