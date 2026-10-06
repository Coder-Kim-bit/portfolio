/**
 * NexusMarket - Ultra-Fast Worldwide Catalog Engine
 * Exchange Rate: 1 USD = 130 KES
 */

export const KES_EXCHANGE_RATE = 130;

export const CATEGORIES = [
  { id: 'all', name: 'All Products (2,000+)' },
  { id: 'ai-models', name: 'AI Models & Workflows' },
  { id: 'dev-tools', name: 'Developer Libraries & SDKs' },
  { id: 'ui-kits', name: 'UI/UX Design Systems' },
  { id: 'python-scripts', name: 'Python Automation & Bots' },
  { id: 'templates', name: 'SaaS Boilerplates & Templates' }
];

const BASE_ITEMS = [
  {
    id: 'prod-1',
    name: 'Gemini Agentic Workflow Engine v2.5',
    category: 'ai-models',
    categoryName: 'AI Models & Workflows',
    priceUSD: 49,
    rating: 4.9,
    reviewsCount: 428,
    badge: 'Worldwide Bestseller',
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80',
    description: 'Production-ready agent orchestration framework with automated tool sandboxes and streaming UI bindings.',
    seller: 'CyberMind Labs'
  },
  {
    id: 'prod-2',
    name: 'SaaS Glassmorphic Dashboard Kit',
    category: 'ui-kits',
    categoryName: 'UI/UX Design Systems',
    priceUSD: 29,
    rating: 4.8,
    reviewsCount: 394,
    badge: 'Popular',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&auto=format&fit=crop&q=80',
    description: 'Complete Figma & CSS design system for dark glassmorphic SaaS apps and admin analytics panels.',
    seller: 'PixelCraft Studio'
  },
  {
    id: 'prod-3',
    name: 'M-Pesa STK Push Express SDK (Python/Node/PHP/Go)',
    category: 'dev-tools',
    categoryName: 'Developer Libraries & SDKs',
    priceUSD: 19,
    rating: 5.0,
    reviewsCount: 512,
    badge: 'Trending Worldwide',
    image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=400&auto=format&fit=crop&q=80',
    description: 'Daraja 2.0 API wrapper for M-Pesa STK Push payments, C2B callbacks, and instant payment verification.',
    seller: 'NairobiDevs'
  },
  {
    id: 'prod-4',
    name: 'Autonomous Web Scraper & RAG Vector Pipeline',
    category: 'python-scripts',
    categoryName: 'Python Automation & Bots',
    priceUSD: 35,
    rating: 4.7,
    reviewsCount: 167,
    badge: 'Top Automation',
    image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&auto=format&fit=crop&q=80',
    description: 'Python scraper that parses complex sites, extracts structured markdown, and indexes vector embeddings.',
    seller: 'PyData Tools'
  },
  {
    id: 'prod-5',
    name: 'Next.js 14 SaaS Boilerplate & Stripe/PayPal Auth',
    category: 'templates',
    categoryName: 'SaaS Boilerplates & Templates',
    priceUSD: 59,
    rating: 4.9,
    reviewsCount: 654,
    badge: 'Top Rated',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&auto=format&fit=crop&q=80',
    description: 'Full-stack React & Next.js digital marketplace template with cart state and payment checkout.',
    seller: 'Apex Templates'
  },
  {
    id: 'prod-6',
    name: 'LLM Prompt Engineering Master Bundle (1,000+ Prompts)',
    category: 'ai-models',
    categoryName: 'AI Models & Workflows',
    priceUSD: 15,
    rating: 4.6,
    reviewsCount: 812,
    badge: 'Essential',
    image: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?w=400&auto=format&fit=crop&q=80',
    description: 'Curated library of tested prompts for coding, copy generation, financial forecasting, and data extraction.',
    seller: 'PromptForge'
  }
];

function buildFastCatalog() {
  const items = [...BASE_ITEMS];
  const prefixes = ['Enterprise', 'Ultra', 'Autonomous', 'Pro', 'Cloud', 'Quantum', 'Zero-Latency', 'Neural'];
  const titles = [
    { name: 'Llama 3 70B Quantized AI Weights', cat: 'ai-models', catName: 'AI Models & Workflows', price: 69 },
    { name: 'DeepSeek Code Assistant Engine', cat: 'ai-models', catName: 'AI Models & Workflows', price: 55 },
    { name: 'Unified Payment Gateway SDK', cat: 'dev-tools', catName: 'Developer Libraries & SDKs', price: 39 },
    { name: 'JWT Auth & OAuth2 Security Middleware', cat: 'dev-tools', catName: 'Developer Libraries & SDKs', price: 24 },
    { name: 'Crypto Wallet Glass UI Kit', cat: 'ui-kits', catName: 'UI/UX Design Systems', price: 34 },
    { name: 'Python Algo Trading Bot', cat: 'python-scripts', catName: 'Python Automation & Bots', price: 89 },
    { name: 'AI Copywriting SaaS Starter Kit', cat: 'templates', catName: 'SaaS Boilerplates & Templates', price: 49 }
  ];

  for (let i = 7; i <= 300; i++) {
    const t = titles[i % titles.length];
    const p = prefixes[i % prefixes.length];
    items.push({
      id: `prod-${i}`,
      name: `${p} ${t.name} v${(i % 5) + 1}.0`,
      category: t.cat,
      categoryName: t.catName,
      priceUSD: t.price + (i % 10) * 3,
      rating: +(4.5 + (i % 5) * 0.1).toFixed(1),
      reviewsCount: 40 + (i % 200),
      badge: i % 3 === 0 ? 'Worldwide Bestseller' : 'Verified Asset',
      image: BASE_ITEMS[i % BASE_ITEMS.length].image,
      description: `High-performance digital asset: ${p} implementation of ${t.name} ready for production deployment.`,
      seller: i % 2 === 0 ? 'Onesmus Kimutai' : 'Nexus Global Labs'
    });
  }
  return items;
}

export const PRODUCTS = buildFastCatalog();
