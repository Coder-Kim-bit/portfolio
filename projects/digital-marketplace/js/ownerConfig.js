/**
 * NexusMarket - Store Owner Payment Integration Settings
 * Configures real-world payment routes for M-Pesa, PayPal, and Stripe.
 */

export const DEFAULT_OWNER_CONFIG = {
  // M-Pesa (Safaricom Daraja API Configuration)
  mpesa: {
    paybillNumber: '174379', // Replace with your real Safaricom Paybill or Till Number
    accountReference: 'NEXUSMARKET',
    darajaConsumerKey: '',
    darajaConsumerSecret: '',
    passkey: 'bfb279f69b5996aa5649778b24a9f3e947065b68f1149f361f13d800ad45b206' // Test passkey or real passkey
  },

  // PayPal Integration
  paypal: {
    merchantEmail: 'onesmuskimtai9@gmail.com', // Your PayPal receiving email
    clientId: 'sb' // PayPal Client ID (Live or Sandbox)
  },

  // Credit Card / Stripe
  stripe: {
    publishableKey: 'pk_test_51Nx...' // Your Stripe Publishable Key
  }
};

export function getOwnerConfig() {
  const saved = localStorage.getItem('NEXUS_OWNER_CONFIG');
  if (saved) {
    try { return JSON.parse(saved); } catch (e) {}
  }
  return DEFAULT_OWNER_CONFIG;
}

export function saveOwnerConfig(config) {
  localStorage.setItem('NEXUS_OWNER_CONFIG', JSON.stringify(config));
}
