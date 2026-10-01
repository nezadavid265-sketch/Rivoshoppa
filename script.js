const THEME_KEY = 'rivoshoppa-theme';
const themeToggle = document.getElementById('themeToggle');

function applyTheme(theme) {
  const nextTheme = theme === 'light' ? 'light' : 'dark';

  try {
    localStorage.setItem(THEME_KEY, nextTheme);
  } catch {
    // Ignore storage issues.
  }

  document.body.dataset.theme = nextTheme;

  if (themeToggle) {
    const isLight = nextTheme === 'light';
    themeToggle.textContent = isLight ? '🌙 Dark mode' : '☀️ Light mode';
    themeToggle.setAttribute('aria-label', isLight ? 'Switch to dark mode' : 'Switch to light mode');
    themeToggle.setAttribute('aria-pressed', String(isLight));
  }
}

if (themeToggle) {
  let savedTheme = null;

  try {
    savedTheme = localStorage.getItem(THEME_KEY);
  } catch {
    savedTheme = null;
  }

  if (!savedTheme && window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    savedTheme = 'light';
  }

  applyTheme(savedTheme || 'dark');
  themeToggle.addEventListener('click', () => {
    const activeTheme = document.body.dataset.theme === 'light' ? 'dark' : 'light';
    applyTheme(activeTheme);
  });
} else {
  document.body.dataset.theme = 'dark';
}

const form = document.getElementById('quoteForm');
const status = document.getElementById('formStatus');
const submitButton = document.getElementById('quoteSubmit');
const registrationForm = document.getElementById('registrationForm');
const registrationStatus = document.getElementById('registrationStatus');
const registerSubmitButton = document.getElementById('registerSubmit');
const counters = document.querySelectorAll('.hero__stat-value');
const cartCountElement = document.getElementById('cartCount');
const CART_KEY = 'safesend_cart';
const ORDERS_STORAGE_KEY = 'safesend_orders';
const DEMO_ORDERS_KEY = 'safesend_demo_orders';
const CUSTOMERS_STORAGE_KEY = 'safesend_customers';
const MARKET_STORAGE_KEY = 'safesend_saved_market';
const SHOP_STORAGE_KEY = 'safesend_market_shops';
const SHOP_CATALOG_SYNCED_KEY = 'safesend_market_shops_synced';
const DEFAULT_SHOP_SECTIONS = [
  {
    id: 'fresh-basket',
    name: 'Fresh Basket',
    category: 'Groceries',
    location: 'Kigali',
    description: 'Fresh produce and daily essentials.',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80',
    products: [
      { id: 'rice-5kg', name: 'Rice 5kg', price: '7,500 RWF', priceValue: 7500, description: 'Clean and easy-cook rice.', image: 'https://images.unsplash.com/photo-1582515073490-39981397c445?auto=format&fit=crop&w=900&q=80' },
      { id: 'fruit-box', name: 'Fruit Box', price: '4,800 RWF', priceValue: 4800, description: 'Assorted seasonal fruits.', image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=900&q=80' },
      { id: 'milk-pack', name: 'Milk Pack', price: '2,900 RWF', priceValue: 2900, description: 'Family-size dairy pack.', image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=900&q=80' },
      { id: 'veggie-bundle', name: 'Veggie Bundle', price: '5,200 RWF', priceValue: 5200, description: 'Fresh vegetables mix.', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80' }
    ]
  },
  {
    id: 'circuit-hub',
    name: 'Circuit Hub',
    category: 'Electronics',
    location: 'Remera',
    description: 'Phones, accessories, and smart devices.',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80',
    products: [
      { id: 'wireless-headphones', name: 'Wireless Headphones', price: '42,000 RWF', priceValue: 42000, description: 'Travel and work audio.', image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=900&q=80' },
      { id: 'smart-watch', name: 'Smart Watch', price: '35,500 RWF', priceValue: 35500, description: 'Health tracking and calls.', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80' },
      { id: 'phone-stand', name: 'Phone Stand', price: '8,200 RWF', priceValue: 8200, description: 'Desk-friendly setup support.', image: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=900&q=80' },
      { id: 'usb-cable', name: 'USB-C Cable', price: '3,700 RWF', priceValue: 3700, description: 'Fast charging cable.', image: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=900&q=80' }
    ]
  },
  {
    id: 'urban-thread',
    name: 'Urban Thread',
    category: 'Fashion',
    location: 'Nyamirambo',
    description: 'Affordable style for daily wear.',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80',
    products: [
      { id: 'classic-tee', name: 'Classic Tee', price: '6,000 RWF', priceValue: 6000, description: 'Comfortable cotton tee.', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80' },
      { id: 'denim-jacket', name: 'Denim Jacket', price: '22,000 RWF', priceValue: 22000, description: 'Casual jacket for daily wear.', image: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80' },
      { id: 'fashion-sneakers', name: 'Fashion Sneakers', price: '18,500 RWF', priceValue: 18500, description: 'Lightweight everyday sneakers.', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80' },
      { id: 'crossbody-bag', name: 'Crossbody Bag', price: '12,900 RWF', priceValue: 12900, description: 'Compact everyday carry.', image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=80' }
    ]
  },
  {
    id: 'glow-cosmetics',
    name: 'Glow Cosmetics',
    category: 'Cosmetics',
    location: 'Kacyiru',
    description: 'Everyday skincare, makeup, and self-care essentials.',
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=80',
    products: [
      { id: 'daily-moisturizer', name: 'Daily Moisturizer', price: '9,500 RWF', priceValue: 9500, description: 'Lightweight hydration for daily use.', image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=900&q=80' },
      { id: 'lip-care-set', name: 'Lip Care Set', price: '6,800 RWF', priceValue: 6800, description: 'Softening balm and gentle lip scrub.', image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=900&q=80' },
      { id: 'body-mist', name: 'Fresh Body Mist', price: '11,500 RWF', priceValue: 11500, description: 'A light, fresh scent for every day.', image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=900&q=80' },
      { id: 'makeup-brush-set', name: 'Makeup Brush Set', price: '14,000 RWF', priceValue: 14000, description: 'Soft brushes for an easy daily routine.', image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=80' }
    ]
  },
  {
    id: 'home-comforts',
    name: 'Home Comforts',
    category: 'Home & Living',
    location: 'Kimironko',
    description: 'Useful home goods for cooking, cleaning, and comfort.',
    image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=900&q=80',
    products: [
      { id: 'storage-basket', name: 'Storage Basket', price: '8,500 RWF', priceValue: 8500, description: 'Woven basket for tidy rooms.', image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=900&q=80' },
      { id: 'cotton-towel-set', name: 'Cotton Towel Set', price: '16,000 RWF', priceValue: 16000, description: 'Soft everyday towels for the home.', image: 'https://images.unsplash.com/photo-1583845112203-454c3b4f6e8f?auto=format&fit=crop&w=900&q=80' },
      { id: 'kitchen-utensils', name: 'Kitchen Utensils', price: '12,500 RWF', priceValue: 12500, description: 'Handy tools for everyday cooking.', image: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=900&q=80' }
    ]
  },
  {
    id: 'wellness-corner',
    name: 'Wellness Corner',
    category: 'Pharmacy & Wellness',
    location: 'Kigali Heights',
    description: 'Wellness basics and personal care products.',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=900&q=80',
    products: [
      { id: 'vitamin-c', name: 'Vitamin C', price: '8,000 RWF', priceValue: 8000, description: 'Daily immune support supplement.', image: 'https://images.unsplash.com/photo-1550572017-edd951b55104?auto=format&fit=crop&w=900&q=80' },
      { id: 'first-aid-kit', name: 'First Aid Kit', price: '18,500 RWF', priceValue: 18500, description: 'Practical essentials for small emergencies.', image: 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?auto=format&fit=crop&w=900&q=80' },
      { id: 'hand-sanitizer', name: 'Hand Sanitizer', price: '3,500 RWF', priceValue: 3500, description: 'Pocket-size sanitizer for clean hands.', image: 'https://images.unsplash.com/photo-1584483766114-2cea6facdf57?auto=format&fit=crop&w=900&q=80' }
    ]
  },
  {
    id: 'paper-trail',
    name: 'Paper Trail',
    category: 'Books & Stationery',
    location: 'Town Centre',
    description: 'Books, notebooks, and supplies for work and study.',
    image: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=900&q=80',
    products: [
      { id: 'hardcover-notebook', name: 'Hardcover Notebook', price: '5,500 RWF', priceValue: 5500, description: 'Durable lined notebook for planning.', image: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&w=900&q=80' },
      { id: 'study-pack', name: 'Study Pack', price: '7,800 RWF', priceValue: 7800, description: 'Pens, pencils, ruler, and eraser.', image: 'https://images.unsplash.com/photo-1456324504439-367cee3b3c32?auto=format&fit=crop&w=900&q=80' },
      { id: 'reading-book', name: 'Featured Reading Book', price: '13,000 RWF', priceValue: 13000, description: 'A thoughtful new read for your shelf.', image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=900&q=80' }
    ]
  },
  {
    id: 'pet-pantry',
    name: 'Pet Pantry',
    category: 'Pet Supplies',
    location: 'Gisozi',
    description: 'Food, treats, and useful supplies for pets.',
    image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=900&q=80',
    products: [
      { id: 'pet-food-pack', name: 'Pet Food Pack', price: '15,000 RWF', priceValue: 15000, description: 'Balanced food for everyday feeding.', image: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&w=900&q=80' },
      { id: 'pet-treats', name: 'Pet Treats', price: '6,500 RWF', priceValue: 6500, description: 'Small rewards for good behavior.', image: 'https://images.unsplash.com/photo-1558788353-f76d92427f16?auto=format&fit=crop&w=900&q=80' },
      { id: 'pet-collar', name: 'Pet Collar', price: '7,500 RWF', priceValue: 7500, description: 'Comfortable adjustable collar.', image: 'https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?auto=format&fit=crop&w=900&q=80' }
    ]
  },
  {
    id: 'table-talk',
    name: 'Table Talk',
    category: 'Restaurants',
    location: 'Kigali City',
    description: 'Ready-to-enjoy meals and drinks from local kitchens.',
    image: 'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=900&q=80',
    products: [
      { id: 'lunch-bowl', name: 'Lunch Bowl', price: '6,500 RWF', priceValue: 6500, description: 'A filling bowl with fresh sides.', image: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80' },
      { id: 'chicken-wrap', name: 'Chicken Wrap', price: '5,800 RWF', priceValue: 5800, description: 'Warm wrap with chicken and crisp salad.', image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=900&q=80' },
      { id: 'fresh-juice', name: 'Fresh Juice', price: '3,000 RWF', priceValue: 3000, description: 'Chilled seasonal fruit juice.', image: 'https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=900&q=80' }
    ]
  }
];

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || '[]');
  } catch {
    return [];
  }
}

function updateCartBadge() {
  if (!cartCountElement) return;
  const count = getCart().length;
  cartCountElement.textContent = `Cart: ${count}`;
}

function saveOrderToStorage(order) {
  try {
    const existing = JSON.parse(localStorage.getItem(ORDERS_STORAGE_KEY) || '[]');
    const next = Array.isArray(existing) ? existing : [];
    const index = next.findIndex((item) => item.id === order.id);
    if (index >= 0) {
      next[index] = { ...next[index], ...order };
    } else {
      next.unshift(order);
    }
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage failures.
  }
}

function getSavedMarketItems() {
  try {
    const stored = JSON.parse(localStorage.getItem(MARKET_STORAGE_KEY) || '[]');
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

function saveSavedMarketItems(items) {
  localStorage.setItem(MARKET_STORAGE_KEY, JSON.stringify(items));
}

function parseCurrencyValue(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^\d.]/g, '');
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function addMarketplaceItemToCart(item) {
  const cart = getCart();
  const normalizedItem = {
    id: `market-${item.id || item.name || Date.now()}`,
    itemType: item.name || item.itemType || 'Marketplace item',
    label: item.name || item.label || 'Marketplace item',
    price: parseCurrencyValue(item.priceValue ?? item.price ?? 0),
    qty: 1,
    source: 'marketplace',
    marketId: item.id || item.marketId || `market-${Date.now()}`,
    marketCategory: item.category || item.marketCategory || 'Product'
  };

  const existingIndex = cart.findIndex((entry) => entry.marketId === normalizedItem.marketId || entry.id === normalizedItem.id);

  if (existingIndex >= 0) {
    cart[existingIndex].qty = Number(cart[existingIndex].qty || 1) + 1;
  } else {
    cart.push(normalizedItem);
  }

  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
  return normalizedItem;
}

function mergeShopSections(baseSections, extraSections) {
  const map = new Map();
  [...baseSections, ...(Array.isArray(extraSections) ? extraSections : [])].forEach((shop) => {
    if (!shop || !shop.name) return;
    const key = shop.id || `${shop.name}:${shop.category || 'general'}`;
    map.set(key, shop);
  });
  return Array.from(map.values());
}

function getShopSections() {
  try {
    const stored = JSON.parse(localStorage.getItem(SHOP_STORAGE_KEY) || '[]');
    if (localStorage.getItem(SHOP_CATALOG_SYNCED_KEY) === 'true') {
      return Array.isArray(stored) ? stored : [];
    }
    return mergeShopSections(DEFAULT_SHOP_SECTIONS, Array.isArray(stored) ? stored : []);
  } catch {
    return [...DEFAULT_SHOP_SECTIONS];
  }
}

function saveShopSections(sections) {
  const next = Array.isArray(sections) ? sections.filter((shop) => shop && shop.name) : [];
  localStorage.setItem(SHOP_STORAGE_KEY, JSON.stringify(next));
  localStorage.setItem(SHOP_CATALOG_SYNCED_KEY, 'true');
}

async function loadRemoteShops() {
  const candidates = [
    '/api/shops',
    `${window.location.protocol}//${window.location.hostname}:4000/api/shops`,
    'http://localhost:4000/api/shops',
  ];

  for (const url of candidates) {
    try {
      const response = await fetch(url);
      if (!response.ok) continue;
      const data = await response.json();
      if (Array.isArray(data)) {
        saveShopSections(data);
        return data;
      }
    } catch {
      // Try next candidate.
    }
  }

  return getShopSections();
}

function getSelectedCategory() {
  const filter = document.getElementById('shopCategoryFilters');
  if (!filter) return 'All';
  const active = filter.querySelector('.is-active');
  return active ? active.dataset.category : 'All';
}

function renderCategoryFilters() {
  const filterWrap = document.getElementById('shopCategoryFilters');
  if (!filterWrap) return;

  const categories = ['All', ...new Set(getShopSections().map((shop) => shop.category))];
  const active = getSelectedCategory();

  filterWrap.innerHTML = categories.map((category) => `
    <button class="shop-filter ${category === active ? 'is-active' : ''}" data-category="${category}">${category}</button>
  `).join('');

  filterWrap.querySelectorAll('.shop-filter').forEach((button) => {
    button.addEventListener('click', () => {
      const category = button.dataset.category;
      filterWrap.querySelectorAll('.shop-filter').forEach((item) => item.classList.toggle('is-active', item.dataset.category === category));
      renderMarketItems();
    });
  });
}

function findProductById(productId) {
  for (const shop of getShopSections()) {
    const match = shop.products.find((entry) => entry.id === productId);
    if (match) return { ...match, category: shop.category, shopName: shop.name };
  }
  return null;
}

function ensureProductPreviewModal() {
  let modal = document.getElementById('productPreviewModal');
  if (modal) return modal;

  modal = document.createElement('div');
  modal.id = 'productPreviewModal';
  modal.className = 'product-preview-modal';
  modal.setAttribute('aria-hidden', 'true');
  modal.innerHTML = `
    <div class="product-preview-modal__backdrop" data-close-preview="true"></div>
    <div class="product-preview-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="productPreviewTitle">
      <button class="product-preview-modal__close" type="button" aria-label="Close preview">×</button>
      <div class="product-preview-modal__content">
        <div class="product-preview-modal__image-wrap">
          <img id="productPreviewImage" src="" alt="Product preview" />
        </div>
        <div class="product-preview-modal__body">
          <span class="shop-tag" id="productPreviewCategory">Product</span>
          <h3 id="productPreviewTitle">Product name</h3>
          <p id="productPreviewDescription">Product description</p>
          <div class="product-preview-modal__meta">
            <strong id="productPreviewPrice">0 RWF</strong>
            <small id="productPreviewShop">Shop name</small>
          </div>
          <div class="product-preview-modal__actions">
            <button type="button" class="btn btn--primary" id="productPreviewAddBtn">Add to cart</button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector('[data-close-preview]').addEventListener('click', () => modal.classList.remove('is-open'));
  modal.querySelector('.product-preview-modal__close').addEventListener('click', () => modal.classList.remove('is-open'));
  modal.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') modal.classList.remove('is-open');
  });

  const addBtn = document.getElementById('productPreviewAddBtn');
  addBtn.addEventListener('click', () => {
    const productId = modal.dataset.productId;
    if (!productId) return;
    const product = findProductById(productId);
    if (!product) return;
    addMarketplaceItemToCart({ ...product, category: product.category, type: 'product' });
    addBtn.textContent = 'Added';
    addBtn.disabled = true;
    setTimeout(() => {
      addBtn.textContent = 'Add to cart';
      addBtn.disabled = false;
      modal.classList.remove('is-open');
    }, 900);
  });

  return modal;
}

function openProductPreview(productId) {
  const product = findProductById(productId);
  if (!product) return;

  const modal = ensureProductPreviewModal();
  const imageEl = document.getElementById('productPreviewImage');
  const titleEl = document.getElementById('productPreviewTitle');
  const descEl = document.getElementById('productPreviewDescription');
  const priceEl = document.getElementById('productPreviewPrice');
  const categoryEl = document.getElementById('productPreviewCategory');
  const shopEl = document.getElementById('productPreviewShop');

  modal.dataset.productId = productId;
  imageEl.src = product.image;
  imageEl.alt = product.name;
  titleEl.textContent = product.name;
  descEl.textContent = product.description;
  priceEl.textContent = product.price;
  categoryEl.textContent = product.category;
  shopEl.textContent = product.shopName || 'Rivoshoppa marketplace';
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  modal.focus?.();
}

function renderMarketItems() {
  const searchBox = document.getElementById('shopSearch');
  const shopList = document.getElementById('shopList');
  const productList = document.getElementById('productList');
  const savedItems = document.getElementById('savedItems');

  if (!searchBox || !shopList || !productList || !savedItems) return;

  const query = searchBox.value.trim().toLowerCase();
  const selectedCategory = getSelectedCategory();
  const saved = getSavedMarketItems();
  const savedShopIds = new Set(saved.filter((item) => item.type === 'shop').map((item) => item.id));
  const savedProductIds = new Set(saved.filter((item) => item.type === 'product').map((item) => item.id));
  const shops = getShopSections();
  const filteredShops = shops.filter((shop) => {
    const matchesCategory = selectedCategory === 'All' || shop.category === selectedCategory;
    const shopText = [shop.name, shop.category, shop.location, shop.description].join(' ').toLowerCase();
    const matchesShop = shopText.includes(query);
    const matchesProduct = shop.products.some((product) => {
      const productText = [product.name, product.description, product.price].join(' ').toLowerCase();
      return productText.includes(query);
    });
    return matchesCategory && (!query || matchesShop || matchesProduct);
  });

  const savedIds = new Set(saved.map((item) => `${item.type}:${item.id}`));

  shopList.innerHTML = filteredShops.length
    ? filteredShops.map((shop) => `
        <article class="shop-block">
          <div class="shop-block__header">
            <div class="shop-block__title-wrap">
              <img class="shop-block__image" src="${shop.image}" alt="${shop.name}">
              <div>
                <span class="shop-tag">${shop.category}</span>
                <h4>${shop.name}</h4>
              </div>
            </div>
            <span class="shop-location">${shop.location}</span>
          </div>
          <p>${shop.description}</p>
          <div class="shop-block__actions">
            <button class="shop-save-btn" data-market-shop="${shop.id}">
              ${savedIds.has(`shop:${shop.id}`) ? 'Saved shop' : 'Save shop'}
            </button>
          </div>
          <div class="shop-product-grid">
            ${shop.products.filter((product) => {
              if (!query) return true;
              const text = [product.name, product.description, product.price].join(' ').toLowerCase();
              return text.includes(query);
            }).map((product) => `
              <article class="shop-product-item">
                <button class="shop-product-item__image-btn" type="button" data-preview-product="${product.id}" aria-label="Zoom ${product.name}">
                  <img src="${product.image}" alt="${product.name}">
                </button>
                <h5>${product.name}</h5>
                <p>${product.description}</p>
                <div class="shop-product-item__footer">
                  <strong>${product.price}</strong>
                  <div class="shop-product-item__actions">
                    <button class="shop-view-btn" type="button" data-preview-product="${product.id}">View</button>
                    <button class="shop-add-btn" data-add-market-item="${product.id}">Add to cart</button>
                  </div>
                </div>
              </article>
            `).join('') || `<p class="empty-state">${shop.products.length ? 'No products match this shop search.' : 'This shop has no products yet.'}</p>`}
          </div>
        </article>
      `).join('')
    : '<p class="empty-state">No shops match your search.</p>';

  const productHighlights = filteredShops.flatMap((shop) => shop.products
    .map((product) => ({ ...product, category: shop.category, sellerOwned: Boolean(shop.ownerId) }))).filter((product) => {
    if (!query) return true;
    const text = [product.name, product.description, product.price].join(' ').toLowerCase();
    return text.includes(query);
  }).sort((first, second) => Number(second.sellerOwned) - Number(first.sellerOwned)).slice(0, 4);

  productList.innerHTML = productHighlights.length
    ? productHighlights.map((product) => `
        <article class="shop-card">
          <img class="shop-card__image" src="${product.image}" alt="${product.name}">
          <div class="shop-card__meta">
            <span class="shop-tag">${product.category}</span>
            <span class="shop-location">${product.price}</span>
          </div>
          <h4>${product.name}</h4>
          <p>${product.description}</p>
          <div class="shop-product-item__actions">
            <button type="button" class="shop-view-btn" data-preview-product="${product.id}">View</button>
            <button type="button" class="shop-add-btn" data-add-market-item="${product.id}">Add to cart</button>
            <button type="button" class="shop-save-btn ${savedIds.has(`product:${product.id}`) ? 'is-saved' : ''}" data-market-item="product:${product.id}">
              ${savedIds.has(`product:${product.id}`) ? 'Saved' : 'Save'}
            </button>
          </div>
        </article>
      `).join('')
    : '<p class="empty-state">No highlighted products found.</p>';

  const savedCards = saved.length
    ? saved.map((item) => `
        <div class="saved-item">
          <div>
            <strong>${item.name}</strong>
            <small>${item.type === 'shop' ? 'Shop' : 'Product'} · ${item.category}</small>
          </div>
          <button class="saved-item__remove" data-remove-market-item="${item.type}:${item.id}">Remove</button>
        </div>
      `).join('')
    : '<p class="empty-state">Save a shop or product to keep it here.</p>';

  savedItems.innerHTML = savedCards;

  document.querySelectorAll('[data-market-shop]').forEach((button) => {
    button.addEventListener('click', () => {
      const shopId = button.dataset.marketShop;
      const shop = getShopSections().find((entry) => entry.id === shopId);
      if (!shop) return;
      const existing = getSavedMarketItems();
      const isSaved = existing.some((entry) => entry.type === 'shop' && entry.id === shopId);
      const savedShop = { id: shop.id, type: 'shop', name: shop.name, category: shop.category, location: shop.location };
      saveSavedMarketItems(isSaved
        ? existing.filter((entry) => !(entry.type === 'shop' && entry.id === shopId))
        : [...existing, savedShop]);
      renderMarketItems();
    });
  });

  document.querySelectorAll('[data-market-item]').forEach((button) => {
    button.addEventListener('click', () => {
      const value = button.dataset.marketItem;
      const [type, id] = value.split(':');
      let item = null;

      if (type === 'product') {
        for (const shop of getShopSections()) {
          const match = shop.products.find((entry) => entry.id === id);
          if (match) {
            item = { ...match, type, category: shop.category, name: match.name };
            break;
          }
        }
      }

      if (!item) return;

      const existing = getSavedMarketItems();
      const isSaved = existing.some((entry) => entry.type === type && entry.id === id);
      const next = isSaved ? existing.filter((entry) => !(entry.type === type && entry.id === id)) : [...existing, item];
      saveSavedMarketItems(next);
      renderMarketItems();
    });
  });

  document.querySelectorAll('[data-preview-product]').forEach((button) => {
    button.addEventListener('click', () => {
      const productId = button.dataset.previewProduct;
      if (productId) openProductPreview(productId);
    });
  });

  document.querySelectorAll('[data-add-market-item]').forEach((button) => {
    button.addEventListener('click', () => {
      const productId = button.dataset.addMarketItem;
      let addedItem = null;

      for (const shop of getShopSections()) {
        const match = shop.products.find((entry) => entry.id === productId);
        if (match) {
          addedItem = addMarketplaceItemToCart({ ...match, category: shop.category, type: 'product' });
          break;
        }
      }

      if (addedItem) {
        const previousText = button.textContent;
        button.textContent = 'Added';
        button.disabled = true;
        setTimeout(() => {
          button.textContent = previousText;
          button.disabled = false;
        }, 1200);
      }
    });
  });

  document.querySelectorAll('[data-remove-market-item]').forEach((button) => {
    button.addEventListener('click', () => {
      const value = button.dataset.removeMarketItem;
      const [type, id] = value.split(':');
      const next = getSavedMarketItems().filter((item) => !(item.type === type && item.id === id));
      saveSavedMarketItems(next);
      renderMarketItems();
    });
  });
}

async function submitOrder(payload) {
  const candidates = [
    '/api/orders',
    `${window.location.protocol}//${window.location.hostname}:4000/api/orders`,
    'http://localhost:4000/api/orders',
  ];

  let lastError = null;

  for (const url of candidates) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const text = await response.text();
      let data = null;
      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          data = null;
        }
      }

      if (response.ok) {
        return { url, data };
      }

      lastError = new Error(data?.error || text || 'Unable to submit quote.');
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError && (lastError.message || '').includes('Failed to fetch')) {
    const demoOrder = {
      id: `SS-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'requested',
      createdAt: new Date().toISOString(),
    };

    const stored = JSON.parse(localStorage.getItem(DEMO_ORDERS_KEY) || '[]');
    stored.push(demoOrder);
    localStorage.setItem(DEMO_ORDERS_KEY, JSON.stringify(stored));

    return { url: 'demo', data: demoOrder };
  }

  throw lastError || new Error('Unable to submit quote.');
}

function animateCounter(element) {
  if (element.dataset.animated === 'true') return;

  const target = parseFloat(element.dataset.target || '0');
  const suffix = element.dataset.suffix || '';
  const prefix = element.dataset.prefix || '';
  const decimals = parseInt(element.dataset.decimals || '0', 10);
  const duration = 1400;
  const startTime = performance.now();

  const tick = (currentTime) => {
    const progress = Math.min((currentTime - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = target * eased;
    element.textContent = `${prefix}${value.toFixed(decimals)}${suffix}`;

    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      element.textContent = `${prefix}${target.toFixed(decimals)}${suffix}`;
      element.dataset.animated = 'true';
    }
  };

  requestAnimationFrame(tick);
}

if (counters.length) {
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.6 });

  counters.forEach((counter) => observer.observe(counter));
}

updateCartBadge();

if (form) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    submitButton.disabled = true;
    status.textContent = 'Sending your request...';
    status.dataset.state = 'pending';

    const payload = {
      name: form.name.value.trim(),
      contact: form.contact.value.trim(),
      pickup: form.pickup.value.trim(),
      dropoff: form.dropoff.value.trim(),
      details: form.details.value.trim(),
      itemType: form.itemType.value,
      items: [{ itemType: form.itemType.value, label: form.itemType.value, qty: 1 }],
    };

    try {
      const result = await submitOrder(payload);
      const orderId = result.data?.id || 'your tracking id';
      if (result.data) {
        const orderToStore = { ...payload, ...result.data };
        saveOrderToStorage(orderToStore);
      }
      status.textContent = `Request received. Your tracking id is ${orderId}.`;
      status.dataset.state = 'success';
      form.reset();

      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        setTimeout(() => {
          const adminLink = document.createElement('a');
          adminLink.href = '/admin-login.html?autologin=1';
          adminLink.textContent = 'Open admin dashboard';
          adminLink.style.display = 'inline-block';
          adminLink.style.marginTop = '8px';
          status.appendChild(document.createElement('br'));
          status.appendChild(adminLink);
        }, 500);
      }
    } catch (error) {
      status.textContent = error.message || 'Something went wrong submitting your request.';
      status.dataset.state = 'error';
    } finally {
      submitButton.disabled = false;
    }
  });
}

if (registrationForm) {
  registrationForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!registrationForm.checkValidity()) {
      registrationForm.reportValidity();
      return;
    }

    registerSubmitButton.disabled = true;
    registrationStatus.textContent = 'Saving your registration...';
    registrationStatus.dataset.state = 'pending';

    const payload = {
      id: 'CUST-' + Math.floor(1000 + Math.random() * 9000),
      name: registrationForm.regName.value.trim(),
      email: registrationForm.regEmail.value.trim(),
      phone: registrationForm.regPhone.value.trim(),
      location: registrationForm.regLocation.value.trim(),
      notes: registrationForm.regNotes.value.trim(),
      createdAt: new Date().toISOString(),
    };

    // Save to localStorage immediately
    try {
      const existing = JSON.parse(localStorage.getItem(CUSTOMERS_STORAGE_KEY) || '[]');
      const customers = Array.isArray(existing) ? existing : [];
      customers.unshift(payload);
      localStorage.setItem(CUSTOMERS_STORAGE_KEY, JSON.stringify(customers));
    } catch {
      // Ignore storage failures
    }

    // Also try to send to backend
    const candidates = [
      '/api/customers',
      `${window.location.protocol}//${window.location.hostname}:4000/api/customers`,
      'http://localhost:4000/api/customers',
    ];

    let backendSaved = false;

    for (const url of candidates) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          backendSaved = true;
          break;
        }
      } catch {
        // Try next candidate
      }
    }

    registrationStatus.textContent = `Thanks ${payload.name}! Your registration was saved.`;
    registrationStatus.dataset.state = 'success';
    registrationForm.reset();
    registerSubmitButton.disabled = false;
  });
}

const marketSearch = document.getElementById('shopSearch');
if (marketSearch) {
  marketSearch.addEventListener('input', renderMarketItems);
}

async function refreshMarketplaceCatalog() {
  const previousCatalog = localStorage.getItem(SHOP_STORAGE_KEY);
  const sections = await loadRemoteShops();
  if (JSON.stringify(sections) === previousCatalog) return;
  renderCategoryFilters();
  renderMarketItems();
}

if (document.getElementById('shopCategoryFilters')) {
  window.addEventListener('storage', (event) => {
    if (event.key === SHOP_STORAGE_KEY || event.key === SHOP_CATALOG_SYNCED_KEY) {
      renderCategoryFilters();
      renderMarketItems();
    }
  });
  setInterval(refreshMarketplaceCatalog, 30000);
}

(async function initMarketplace() {
  // Render the built-in catalog immediately; remote shops can enhance it afterward.
  renderCategoryFilters();
  renderMarketItems();

  const sections = await loadRemoteShops();
  saveShopSections(sections);
  renderCategoryFilters();
  renderMarketItems();
})();
