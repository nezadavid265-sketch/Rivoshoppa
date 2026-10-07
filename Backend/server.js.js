require("dotenv").config();

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const {
  checkCredentials, issueToken, revokeToken, requireAuth,
  hashPassword, verifyPassword, issueSellerToken, revokeSellerToken, requireSellerAuth
} = require("./auth");
const { notifyContact } = require("./notification");
const {
  createPaymentIntent,
  getPaymentByReference,
  normalizePaymentStatus,
  upsertPayment,
  safePaymentResponse,
  normalizeRwandaMsisdn,
  isValidRwandaMobileMoney,
  buildPaymentReference,
} = require("./payment");

const app = express();
const PORT = process.env.PORT || 4000;
const ORDERS_DATA_FILE = path.join(__dirname, "data", "orders.json");
const CUSTOMERS_DATA_FILE = path.join(__dirname, "data", "customers.json");
const SHOPS_DATA_FILE = path.join(__dirname, "data", "shops.json");
const SELLERS_DATA_FILE = path.join(__dirname, "data", "sellers.json");

const DEFAULT_SHOPS = [
  {
    id: "fresh-basket",
    name: "Fresh Basket",
    category: "Groceries",
    location: "Kigali",
    description: "Fresh produce and daily essentials.",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80",
    products: [
      { id: "rice-5kg", name: "Rice 5kg", price: "7,500 RWF", priceValue: 7500, description: "Clean and easy-cook rice.", image: "https://images.unsplash.com/photo-1582515073490-39981397c445?auto=format&fit=crop&w=900&q=80" },
      { id: "fruit-box", name: "Fruit Box", price: "4,800 RWF", priceValue: 4800, description: "Assorted seasonal fruits.", image: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=900&q=80" },
      { id: "milk-pack", name: "Milk Pack", price: "2,900 RWF", priceValue: 2900, description: "Family-size dairy pack.", image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=900&q=80" },
      { id: "veggie-bundle", name: "Veggie Bundle", price: "5,200 RWF", priceValue: 5200, description: "Fresh vegetables mix.", image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80" }
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: "circuit-hub",
    name: "Circuit Hub",
    category: "Electronics",
    location: "Remera",
    description: "Phones, accessories, and smart devices.",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80",
    products: [
      { id: "wireless-headphones", name: "Wireless Headphones", price: "42,000 RWF", priceValue: 42000, description: "Travel and work audio.", image: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=900&q=80" },
      { id: "smart-watch", name: "Smart Watch", price: "35,500 RWF", priceValue: 35500, description: "Health tracking and calls.", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80" },
      { id: "phone-stand", name: "Phone Stand", price: "8,200 RWF", priceValue: 8200, description: "Desk-friendly setup support.", image: "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=900&q=80" },
      { id: "usb-cable", name: "USB-C Cable", price: "3,700 RWF", priceValue: 3700, description: "Fast charging cable.", image: "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=900&q=80" }
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: "urban-thread",
    name: "Urban Thread",
    category: "Fashion",
    location: "Nyamirambo",
    description: "Affordable style for daily wear.",
    image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80",
    products: [
      { id: "classic-tee", name: "Classic Tee", price: "6,000 RWF", priceValue: 6000, description: "Comfortable cotton tee.", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80" },
      { id: "denim-jacket", name: "Denim Jacket", price: "22,000 RWF", priceValue: 22000, description: "Casual jacket for daily wear.", image: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80" },
      { id: "fashion-sneakers", name: "Fashion Sneakers", price: "18,500 RWF", priceValue: 18500, description: "Lightweight everyday sneakers.", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80" },
      { id: "crossbody-bag", name: "Crossbody Bag", price: "12,900 RWF", priceValue: 12900, description: "Compact everyday carry.", image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=80" }
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: "glow-cosmetics",
    name: "Glow Cosmetics",
    category: "Cosmetics",
    location: "Kacyiru",
    description: "Everyday skincare, makeup, and self-care essentials.",
    image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=80",
    products: [
      { id: "daily-moisturizer", name: "Daily Moisturizer", price: "9,500 RWF", priceValue: 9500, description: "Lightweight hydration for daily use.", image: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=900&q=80" },
      { id: "lip-care-set", name: "Lip Care Set", price: "6,800 RWF", priceValue: 6800, description: "Softening balm and gentle lip scrub.", image: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=900&q=80" },
      { id: "body-mist", name: "Fresh Body Mist", price: "11,500 RWF", priceValue: 11500, description: "A light, fresh scent for every day.", image: "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=900&q=80" },
      { id: "makeup-brush-set", name: "Makeup Brush Set", price: "14,000 RWF", priceValue: 14000, description: "Soft brushes for an easy daily routine.", image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=80" }
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: "home-comforts",
    name: "Home Comforts",
    category: "Home & Living",
    location: "Kimironko",
    description: "Useful home goods for cooking, cleaning, and comfort.",
    image: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=900&q=80",
    products: [
      { id: "storage-basket", name: "Storage Basket", price: "8,500 RWF", priceValue: 8500, description: "Woven basket for tidy rooms.", image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=900&q=80" },
      { id: "cotton-towel-set", name: "Cotton Towel Set", price: "16,000 RWF", priceValue: 16000, description: "Soft everyday towels for the home.", image: "https://images.unsplash.com/photo-1583845112203-454c3b4f6e8f?auto=format&fit=crop&w=900&q=80" },
      { id: "kitchen-utensils", name: "Kitchen Utensils", price: "12,500 RWF", priceValue: 12500, description: "Handy tools for everyday cooking.", image: "https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=900&q=80" }
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: "wellness-corner",
    name: "Wellness Corner",
    category: "Pharmacy & Wellness",
    location: "Kigali Heights",
    description: "Wellness basics and personal care products.",
    image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=900&q=80",
    products: [
      { id: "vitamin-c", name: "Vitamin C", price: "8,000 RWF", priceValue: 8000, description: "Daily immune support supplement.", image: "https://images.unsplash.com/photo-1550572017-edd951b55104?auto=format&fit=crop&w=900&q=80" },
      { id: "first-aid-kit", name: "First Aid Kit", price: "18,500 RWF", priceValue: 18500, description: "Practical essentials for small emergencies.", image: "https://images.unsplash.com/photo-1603398938378-e54eab446dde?auto=format&fit=crop&w=900&q=80" },
      { id: "hand-sanitizer", name: "Hand Sanitizer", price: "3,500 RWF", priceValue: 3500, description: "Pocket-size sanitizer for clean hands.", image: "https://images.unsplash.com/photo-1584483766114-2cea6facdf57?auto=format&fit=crop&w=900&q=80" }
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: "paper-trail",
    name: "Paper Trail",
    category: "Books & Stationery",
    location: "Town Centre",
    description: "Books, notebooks, and supplies for work and study.",
    image: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=900&q=80",
    products: [
      { id: "hardcover-notebook", name: "Hardcover Notebook", price: "5,500 RWF", priceValue: 5500, description: "Durable lined notebook for planning.", image: "https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&w=900&q=80" },
      { id: "study-pack", name: "Study Pack", price: "7,800 RWF", priceValue: 7800, description: "Pens, pencils, ruler, and eraser.", image: "https://images.unsplash.com/photo-1456324504439-367cee3b3c32?auto=format&fit=crop&w=900&q=80" },
      { id: "reading-book", name: "Featured Reading Book", price: "13,000 RWF", priceValue: 13000, description: "A thoughtful new read for your shelf.", image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=900&q=80" }
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: "pet-pantry",
    name: "Pet Pantry",
    category: "Pet Supplies",
    location: "Gisozi",
    description: "Food, treats, and useful supplies for pets.",
    image: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=900&q=80",
    products: [
      { id: "pet-food-pack", name: "Pet Food Pack", price: "15,000 RWF", priceValue: 15000, description: "Balanced food for everyday feeding.", image: "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&w=900&q=80" },
      { id: "pet-treats", name: "Pet Treats", price: "6,500 RWF", priceValue: 6500, description: "Small rewards for good behavior.", image: "https://images.unsplash.com/photo-1558788353-f76d92427f16?auto=format&fit=crop&w=900&q=80" },
      { id: "pet-collar", name: "Pet Collar", price: "7,500 RWF", priceValue: 7500, description: "Comfortable adjustable collar.", image: "https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?auto=format&fit=crop&w=900&q=80" }
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: "table-talk",
    name: "Table Talk",
    category: "Restaurants",
    location: "Kigali City",
    description: "Ready-to-enjoy meals and drinks from local kitchens.",
    image: "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=900&q=80",
    products: [
      { id: "lunch-bowl", name: "Lunch Bowl", price: "6,500 RWF", priceValue: 6500, description: "A filling bowl with fresh sides.", image: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80" },
      { id: "chicken-wrap", name: "Chicken Wrap", price: "5,800 RWF", priceValue: 5800, description: "Warm wrap with chicken and crisp salad.", image: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=900&q=80" },
      { id: "fresh-juice", name: "Fresh Juice", price: "3,000 RWF", priceValue: 3000, description: "Chilled seasonal fruit juice.", image: "https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=900&q=80" }
    ],
    createdAt: new Date().toISOString(),
  }
];

app.use(cors());
app.use(express.json({ limit: "5mb" }));
app.use(express.static(__dirname));

const STANDARD_DELIVERY_FEE = 1000;

function ensureStandardDelivery(items) {
  const safeItems = Array.isArray(items) ? items.map((item) => ({ ...item })) : [];
  const hasStandardDelivery = safeItems.some((item) => {
    const label = String(item?.label || "");
    return item?.itemType === "delivery" || /standard delivery/i.test(label);
  });

  if (!hasStandardDelivery) {
    safeItems.push({
      itemType: "delivery",
      label: "Standard delivery",
      price: STANDARD_DELIVERY_FEE,
      qty: 1,
      source: "delivery",
    });
  }

  return safeItems;
}

function readJson(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const raw = fs.readFileSync(filePath, "utf-8").trim();
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (error) {
    console.warn(`Unable to read ${path.basename(filePath)}, using fallback.`, error.message);
    return fallback;
  }
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function readOrders() {
  return readJson(ORDERS_DATA_FILE, []);
}
function writeOrders(orders) {
  writeJson(ORDERS_DATA_FILE, orders);
}
function readCustomers() {
  return readJson(CUSTOMERS_DATA_FILE, []);
}
function writeCustomers(customers) {
  writeJson(CUSTOMERS_DATA_FILE, customers);
}
function mergeBuiltInShops(shops = []) {
  const catalog = new Map();
  [...DEFAULT_SHOPS, ...(Array.isArray(shops) ? shops : [])].forEach((shop) => {
    if (!shop || !shop.name) return;
    const key = shop.id || `${shop.name}:${shop.category || "general"}`;
    catalog.set(key, {
      ...shop,
      products: Array.isArray(shop.products) ? shop.products : [],
    });
  });
  return Array.from(catalog.values());
}

function readShops() {
  return mergeBuiltInShops(readJson(SHOPS_DATA_FILE, []));
}
function writeShops(shops) {
  writeJson(SHOPS_DATA_FILE, mergeBuiltInShops(shops));
}
function readSellers() {
  return readJson(SELLERS_DATA_FILE, []);
}
function writeSellers(sellers) {
  writeJson(SELLERS_DATA_FILE, sellers);
}
function makeId() {
  return "SS-" + Math.floor(1000 + Math.random() * 9000);
}

const STATUS_STEPS = ["requested", "picked_up", "in_transit", "delivered"];
const STATUS_LABEL = {
  requested: "Requested",
  picked_up: "Picked up",
  in_transit: "In transit",
  delivered: "Delivered",
};

function makeSellerId() {
  return `SELLER-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function sanitizeSeller(seller) {
  if (!seller) return null;
  const { passwordHash, ...safe } = seller;
  return safe;
}

function normalizeProduct(product, shopImage = "") {
  return {
    id: product.id || `product-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: String(product.name || "Product").trim(),
    price: String(product.price || (Number(product.priceValue || 0).toLocaleString("en-US") + " RWF")).trim(),
    priceValue: Number(product.priceValue ?? String(product.price || "").replace(/[^\d.]/g, "")) || 0,
    description: String(product.description || "").trim() || "Quality product available on Rivoshoppa.",
    image: String(product.image || shopImage || "").trim(),
  };
}

function normalizeShopPayload(body, previous = {}) {
  const image = String(body.image ?? previous.image ?? "").trim();
  return {
    ...previous,
    name: String(body.name ?? previous.name ?? "").trim(),
    category: String(body.category ?? previous.category ?? "").trim(),
    location: String(body.location ?? previous.location ?? "").trim(),
    description: String(body.description ?? previous.description ?? "").trim(),
    image,
    products: Array.isArray(body.products)
      ? body.products.map((product) => normalizeProduct(product, image))
      : Array.isArray(previous.products) ? previous.products : [],
  };
}

function validateShop(shop, requireProducts = false) {
  if (!shop.name || !shop.category || !shop.location) {
    return "Shop name, category, and location are required.";
  }
  if (requireProducts && (!Array.isArray(shop.products) || shop.products.length === 0)) {
    return "Add at least one product before publishing this shop.";
  }
  for (const product of shop.products) {
    if (!product.name || !Number.isFinite(Number(product.priceValue)) || Number(product.priceValue) < 0) {
      return "Every product needs a name and a valid price.";
    }
  }
  return null;
}

// ================= PUBLIC ROUTES =================
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/maps/config", (req, res) => {
  res.json({ apiKey: process.env.GOOGLE_MAPS_API_KEY || "" });
});

app.get("/api/auth/google/config", (req, res) => {
  res.json({ clientId: process.env.GOOGLE_CLIENT_ID || "" });
});

app.post("/api/auth/google", async (req, res) => {
  const { credential, role } = req.body || {};
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return res.status(503).json({ error: "Google sign-in is not configured yet." });
  }
  if (!credential || role !== "seller") {
    return res.status(400).json({ error: "A Google credential for a seller account is required." });
  }

  try {
    const verification = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
    if (!verification.ok) {
      return res.status(401).json({ error: "Google could not verify this account. Please try again." });
    }
    const identity = await verification.json();
    if (identity.aud !== clientId || identity.email_verified !== "true" || !identity.email || !identity.sub) {
      return res.status(401).json({ error: "Google could not verify this account. Please try again." });
    }

    const email = String(identity.email).trim().toLowerCase();
    const sellers = readSellers();
    const seller = sellers.find((entry) => entry.email === email);
    if (!seller) return res.status(404).json({ error: "No seller account exists for this Google email." });
    if (seller.status !== "active") {
      return res.status(403).json({
        error: seller.status === "pending"
          ? "Your seller account is waiting for admin approval."
          : "Your seller account is currently suspended.",
      });
    }
    seller.lastLoginAt = new Date().toISOString();
    writeSellers(sellers);
    return res.json({ token: issueSellerToken(seller.id), seller: sanitizeSeller(seller) });
  } catch (error) {
    console.error("Google sign-in verification failed", error);
    return res.status(502).json({ error: "Unable to verify your Google account right now. Please try again." });
  }
});

app.post("/api/customers", (req, res) => {
  try {
    const { name, email, phone, location, notes } = req.body || {};

    if (!name || !email || !phone || !location) {
      return res.status(400).json({ error: "Missing required customer fields." });
    }

    const customer = {
      id: makeId(),
      name,
      email,
      phone,
      location,
      notes: notes || "",
      createdAt: new Date().toISOString(),
    };

    const customers = readCustomers();
    customers.push(customer);
    writeCustomers(customers);

    return res.status(201).json(customer);
  } catch (error) {
    console.error("Failed to create customer", error);
    return res.status(500).json({ error: "Unable to save customer right now." });
  }
});

app.post("/api/orders", async (req, res) => {
  try {
    const { name, contact, pickup, dropoff, details, items, paymentMethod, paymentPhone, phoneNumber } = req.body || {};

    const orderItems = ensureStandardDelivery(Array.isArray(items) && items.length > 0
      ? items
      : [{ itemType: req.body?.itemType, label: req.body?.itemType || "Delivery", qty: 1 }]);

    if (!name || !contact || !pickup || !dropoff || orderItems.length === 0) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const allowedPaymentMethods = ["mtn_mobile_money", "airtel_money", "card", "cash_on_delivery"];
    if (!allowedPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({ error: "Choose a valid payment method." });
    }

    const mobilePaymentPhone = String(paymentPhone || phoneNumber || contact || "").trim();
    const isMobileMoney = ["mtn_mobile_money", "airtel_money"].includes(paymentMethod);
    if (isMobileMoney && !isValidRwandaMobileMoney(mobilePaymentPhone)) {
      return res.status(400).json({ error: "Enter a valid Rwanda mobile-money number for the selected provider." });
    }

    const total = orderItems.reduce((sum, item) => {
      const price = Number(item.price || 0);
      const quantity = Math.max(1, Number(item.qty || 1));
      return sum + (Number.isFinite(price) ? price * quantity : 0);
    }, 0);
    const paymentReference = buildPaymentReference(makeId());

    const order = {
      id: makeId(),
      name,
      contact,
      pickup,
      dropoff,
      details: details || "",
      items: orderItems,
      total,
      paymentMethod,
      paymentPhone: isMobileMoney ? normalizeRwandaMsisdn(mobilePaymentPhone) : "",
      paymentStatus: isMobileMoney ? "pending" : "confirmed",
      paymentReference,
      status: "requested",
      history: [{ status: "requested", at: new Date().toISOString() }],
      createdAt: new Date().toISOString(),
      source: req.body?.source || "cart",
      submittedAt: req.body?.submittedAt || new Date().toISOString(),
      customer: {
        name,
        contact,
        pickup,
        dropoff,
        details: details || "",
      },
    };

    const orders = readOrders();
    orders.push(order);
    writeOrders(orders);

    const paymentMessage = isMobileMoney
      ? `Pay ${total.toLocaleString("en-US")} RWF via ${paymentMethod === "mtn_mobile_money" ? "MTN" : "Airtel"} Mobile Money. Follow the order payment flow in the app. Order ${order.id}.`
      : `Payment method recorded for order ${order.id}: ${total.toLocaleString("en-US")} RWF.`;
    const notification = await notifyContact(
      isMobileMoney ? normalizeRwandaMsisdn(mobilePaymentPhone) || contact : contact,
      `Rivoshoppa order ${order.id} received`,
      paymentMessage
    ).catch((error) => ({ sent: false, reason: error.message }));

    return res.status(201).json({ ...order, notification });
  } catch (error) {
    console.error("Failed to create order", error);
    return res.status(500).json({ error: "Unable to create order right now." });
  }
});

app.post("/api/payments/initiate", async (req, res) => {
  try {
    const { orderId, provider, amount, currency = "RWF", phone, note } = req.body || {};

    if (!provider || !["mtn_mobile_money", "airtel_money"].includes(provider)) {
      return res.status(400).json({ error: "Choose a supported provider: MTN Mobile Money or Airtel Money." });
    }

    if (!currency || String(currency).toUpperCase() !== "RWF") {
      return res.status(400).json({ error: "Rivoshoppa payments must use RWF currency." });
    }

    if (!phone || !isValidRwandaMobileMoney(phone)) {
      return res.status(400).json({ error: "Enter a valid Rwanda mobile-money number for the selected provider." });
    }

    if (!orderId) {
      return res.status(400).json({ error: "Order ID is required before initiating a payment." });
    }

    const orders = readOrders();
    const order = orders.find((entry) => entry.id === String(orderId).toUpperCase());
    if (!order) {
      return res.status(404).json({ error: "Order not found." });
    }

    const chosenProvider = provider || order.paymentMethod;
    const orderAmount = Number(amount ?? order.total ?? 0);
    const payerPhone = phone || order.paymentPhone || order.contact;

    if (Number(order.total) !== orderAmount) {
      return res.status(400).json({ error: "The ordered amount does not match the server-calculated total." });
    }

    if (String(order.paymentMethod || "") !== chosenProvider) {
      return res.status(400).json({ error: "The order is not configured for this payment provider." });
    }

    const paymentRequest = await createPaymentIntent({
      orderId: order.id,
      provider: chosenProvider,
      amount: orderAmount,
      currency,
      phone: payerPhone,
      note: note || `Rivoshoppa order ${order.id}`,
    });

    const paymentReference = paymentRequest.reference || order.paymentReference || buildPaymentReference(order.id);
    const payment = upsertPayment({
      orderId: order.id,
      reference: paymentReference,
      providerReference: paymentRequest.providerReference || paymentReference,
      provider: chosenProvider,
      amount: Number(orderAmount),
      currency: String(currency || "RWF").toUpperCase(),
      phone: normalizeRwandaMsisdn(payerPhone),
      status: paymentRequest.status || "PENDING",
      nextAction: paymentRequest.nextAction,
      providerMessage: paymentRequest.providerMessage || "Payment request initiated.",
      requiresConfiguration: false,
    });

    order.paymentReference = paymentReference;
    order.paymentPhone = normalizeRwandaMsisdn(payerPhone);
    order.paymentStatus = "pending";
    order.history.push({ status: "requested", at: new Date().toISOString() });
    writeOrders(orders);

    return res.status(200).json({
      ok: true,
      payment: safePaymentResponse(payment),
      message: paymentRequest.nextAction,
      orderId: order.id,
    });
  } catch (error) {
    console.error("Failed to initiate provider payment", error);
    const message = error.message || "Unable to start the payment request right now.";
    return res.status(400).json({
      error: message,
      paymentStatus: "FAILED",
    });
  }
});

app.post("/api/payments/webhook/:provider", async (req, res) => {
  try {
    const { provider } = req.params;
    const payload = req.body || {};
    const reference = payload.reference || payload.externalId || payload.data?.reference || payload.data?.externalId || payload.providerReference;

    if (!reference) {
      return res.status(400).json({ error: "Provider reference is required." });
    }

    const payment = getPaymentByReference(reference);
    if (!payment) {
      return res.status(404).json({ error: "Payment not found for this provider callback." });
    }

    const statusSource = payload.status || payload.data?.status || payload.transaction?.status || payload.state;
    const nextStatus = normalizePaymentStatus(statusSource || (payload.success ? "SUCCESSFUL" : "FAILED"));

    const updated = upsertPayment({
      ...payment,
      status: nextStatus,
      providerReference: reference,
      providerMessage: payload.message || payment.providerMessage || "Provider callback processed.",
      updatedAt: new Date().toISOString(),
    });

    const orders = readOrders();
    const order = orders.find((entry) => entry.id === updated.orderId);
    if (order) {
      order.paymentStatus = nextStatus.toLowerCase();
      order.status = nextStatus === "SUCCESSFUL" ? "requested" : order.status;
      writeOrders(orders);
    }

    return res.status(200).json({ ok: true, payment: safePaymentResponse(updated) });
  } catch (error) {
    console.error("Failed to process payment callback", error);
    return res.status(500).json({ error: "Unable to process payment callback." });
  }
});

app.get("/api/orders/:id/track", (req, res) => {
  const orders = readOrders();
  const orderId = req.params.id.toUpperCase();
  const order = orders.find((o) => o.id === orderId);
  if (!order) return res.status(404).json({ error: "No order found with that tracking id." });

  res.json({
    id: order.id,
    status: order.status,
    statusLabel: STATUS_LABEL[order.status],
    steps: STATUS_STEPS,
    history: order.history,
    pickup: order.pickup,
    dropoff: order.dropoff,
    items: order.items,
    createdAt: order.createdAt,
  });
});


// ================= SELLER AUTH & SELLER PORTAL =================
app.post("/api/seller/register", (req, res) => {
  try {
    const { ownerName, businessName, email, phone, location, category, password } = req.body || {};
    if (!ownerName || !businessName || !email || !phone || !location || !password) {
      return res.status(400).json({ error: "Owner name, business name, email, phone, location, and password are required." });
    }
    if (String(password).length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters." });
    }

    const sellers = readSellers();
    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedPhone = String(phone).trim();
    if (sellers.some((seller) => seller.email === normalizedEmail)) {
      return res.status(409).json({ error: "A seller account already exists with that email." });
    }
    if (sellers.some((seller) => seller.phone === normalizedPhone)) {
      return res.status(409).json({ error: "A seller account already exists with that phone number." });
    }

    const seller = {
      id: makeSellerId(),
      ownerName: String(ownerName).trim(),
      businessName: String(businessName).trim(),
      email: normalizedEmail,
      phone: normalizedPhone,
      location: String(location).trim(),
      category: String(category || "General").trim(),
      status: "pending",
      passwordHash: hashPassword(password),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    sellers.push(seller);
    writeSellers(sellers);
    return res.status(201).json({
      seller: sanitizeSeller(seller),
      message: "Seller application received. An administrator must approve the account before login is enabled.",
    });
  } catch (error) {
    console.error("Seller registration failed", error);
    return res.status(500).json({ error: "Unable to create seller account right now." });
  }
});

app.post("/api/seller/login", (req, res) => {
  const { email, password } = req.body || {};
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const seller = readSellers().find((entry) => entry.email === normalizedEmail);

  if (!seller || !verifyPassword(password || "", seller.passwordHash)) {
    return res.status(401).json({ error: "Invalid seller email or password." });
  }
  if (seller.status !== "active") {
    return res.status(403).json({
      error: seller.status === "pending"
        ? "Your seller account is waiting for admin approval."
        : "Your seller account is currently suspended.",
    });
  }

  seller.lastLoginAt = new Date().toISOString();
  writeSellers(readSellers().map((entry) => entry.id === seller.id ? seller : entry));

  const token = issueSellerToken(seller.id);
  return res.json({ token, seller: sanitizeSeller(seller) });
});

app.post("/api/seller/logout", requireSellerAuth, (req, res) => {
  revokeSellerToken(req.sellerToken);
  res.json({ ok: true });
});

app.get("/api/seller/me", requireSellerAuth, (req, res) => {
  const seller = readSellers().find((entry) => entry.id === req.sellerId);
  if (!seller) return res.status(404).json({ error: "Seller account not found." });
  res.json(sanitizeSeller(seller));
});

app.get("/api/seller/shops", requireSellerAuth, (req, res) => {
  const shops = readShops().filter((shop) => shop.ownerId === req.sellerId);
  res.json(shops);
});

app.post("/api/seller/shops", requireSellerAuth, (req, res) => {
  const seller = readSellers().find((entry) => entry.id === req.sellerId);
  if (!seller || seller.status !== "active") return res.status(403).json({ error: "Seller account is not active." });

  const shop = normalizeShopPayload(req.body || {});
  const validationError = validateShop(shop);
  if (validationError) return res.status(400).json({ error: validationError });

  shop.id = `shop-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  shop.ownerId = req.sellerId;
  shop.ownerName = seller.ownerName;
  shop.sellerBusinessName = seller.businessName;
  shop.status = "active";
  shop.createdAt = new Date().toISOString();
  shop.updatedAt = new Date().toISOString();

  const shops = readShops();
  shops.push(shop);
  writeShops(shops);
  return res.status(201).json(shop);
});

app.put("/api/seller/shops/:id", requireSellerAuth, (req, res) => {
  const shops = readShops();
  const index = shops.findIndex((shop) => shop.id === req.params.id && shop.ownerId === req.sellerId);
  if (index < 0) return res.status(404).json({ error: "Your shop was not found." });

  const updated = normalizeShopPayload(req.body || {}, shops[index]);
  const validationError = validateShop(updated);
  if (validationError) return res.status(400).json({ error: validationError });

  updated.ownerId = req.sellerId;
  updated.updatedAt = new Date().toISOString();
  shops[index] = updated;
  writeShops(shops);
  return res.json(updated);
});

app.delete("/api/seller/shops/:id", requireSellerAuth, (req, res) => {
  const shops = readShops();
  const next = shops.filter((shop) => !(shop.id === req.params.id && shop.ownerId === req.sellerId));
  if (next.length === shops.length) return res.status(404).json({ error: "Your shop was not found." });
  writeShops(next);
  res.json({ ok: true });
});

app.get("/api/shops", (req, res) => {
  const shops = readShops().filter((shop) => shop.status !== "inactive");
  res.json(shops);
});

// ================= ADMIN AUTH =================
app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;
  if (!checkCredentials(username, password)) {
    return res.status(401).json({ error: "Invalid username or password." });
  }
  const token = issueToken();
  res.json({ token });
});

app.post("/api/admin/logout", requireAuth, (req, res) => {
  const token = req.headers.authorization.slice(7);
  revokeToken(token);
  res.json({ ok: true });
});

// ================= ADMIN (PROTECTED) ROUTES =================
app.get("/api/admin/orders", requireAuth, (req, res) => {
  const orders = readOrders().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(orders);
});

app.get("/api/admin/customers", requireAuth, (req, res) => {
  const customers = readCustomers().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(customers);
});

app.get("/api/admin/shops", requireAuth, (req, res) => {
  const shops = readShops().sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  res.json(shops);
});

app.post("/api/admin/shops", requireAuth, (req, res) => {
  const shop = normalizeShopPayload(req.body || {});
  const validationError = validateShop(shop, true);
  if (validationError) return res.status(400).json({ error: validationError });
  shop.id = `shop-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  shop.ownerId = req.body.ownerId || null;
  const seller = readSellers().find((entry) => entry.id === shop.ownerId);
  shop.ownerName = seller ? seller.ownerName : "Rivoshoppa Admin";
  shop.sellerBusinessName = seller ? seller.businessName : shop.name;
  shop.status = req.body.status === "inactive" ? "inactive" : "active";
  shop.createdAt = new Date().toISOString();
  shop.updatedAt = new Date().toISOString();
  const shops = readShops();
  shops.push(shop);
  writeShops(shops);
  res.status(201).json(shop);
});

app.patch("/api/admin/shops/:id", requireAuth, (req, res) => {
  const shops = readShops();
  const index = shops.findIndex((shop) => shop.id === req.params.id);
  if (index < 0) return res.status(404).json({ error: "Shop not found." });
  const updated = normalizeShopPayload(req.body || {}, shops[index]);
  const validationError = validateShop(updated, true);
  if (validationError) return res.status(400).json({ error: validationError });
  if (Object.prototype.hasOwnProperty.call(req.body || {}, "status")) {
    updated.status = req.body.status === "inactive" ? "inactive" : "active";
  }
  if (Object.prototype.hasOwnProperty.call(req.body || {}, "ownerId")) {
    updated.ownerId = req.body.ownerId || null;
    const seller = readSellers().find((entry) => entry.id === updated.ownerId);
    updated.ownerName = seller ? seller.ownerName : "Rivoshoppa Admin";
    updated.sellerBusinessName = seller ? seller.businessName : updated.name;
  }
  updated.updatedAt = new Date().toISOString();
  shops[index] = updated;
  writeShops(shops);
  res.json(updated);
});

app.delete("/api/admin/shops/:id", requireAuth, (req, res) => {
  const shops = readShops();
  const next = shops.filter((shop) => shop.id !== req.params.id);
  if (next.length === shops.length) return res.status(404).json({ error: "Shop not found." });
  writeShops(next);
  res.json({ ok: true });
});

app.delete("/api/admin/shops/:id/products/:productId", requireAuth, (req, res) => {
  const shops = readShops();
  const shop = shops.find((entry) => entry.id === req.params.id);
  if (!shop) return res.status(404).json({ error: "Shop not found." });

  const products = Array.isArray(shop.products) ? shop.products : [];
  const nextProducts = products.filter((product) => product.id !== req.params.productId);
  if (nextProducts.length === products.length) return res.status(404).json({ error: "Product not found." });

  shop.products = nextProducts;
  shop.updatedAt = new Date().toISOString();
  writeShops(shops);
  res.json(shop);
});

// ================= ADMIN SELLER MANAGEMENT =================
app.get("/api/admin/sellers", requireAuth, (req, res) => {
  const sellers = readSellers().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(sellers.map(sanitizeSeller));
});

app.patch("/api/admin/sellers/:id/status", requireAuth, (req, res) => {
  const allowed = ["pending", "active", "suspended", "rejected"];
  const status = String(req.body?.status || "");
  if (!allowed.includes(status)) return res.status(400).json({ error: "Invalid seller status." });
  const sellers = readSellers();
  const index = sellers.findIndex((seller) => seller.id === req.params.id);
  if (index < 0) return res.status(404).json({ error: "Seller not found." });
  sellers[index].status = status;
  sellers[index].updatedAt = new Date().toISOString();
  writeSellers(sellers);
  res.json(sanitizeSeller(sellers[index]));
});

app.patch("/api/admin/sellers/:id", requireAuth, (req, res) => {
  const sellers = readSellers();
  const index = sellers.findIndex((seller) => seller.id === req.params.id);
  if (index < 0) return res.status(404).json({ error: "Seller not found." });
  const current = sellers[index];
  const next = {
    ...current,
    ownerName: String(req.body?.ownerName ?? current.ownerName).trim(),
    businessName: String(req.body?.businessName ?? current.businessName).trim(),
    email: String(req.body?.email ?? current.email).trim().toLowerCase(),
    phone: String(req.body?.phone ?? current.phone).trim(),
    location: String(req.body?.location ?? current.location).trim(),
    category: String(req.body?.category ?? current.category).trim(),
    updatedAt: new Date().toISOString(),
  };
  if (req.body?.password) {
    if (String(req.body.password).length < 8) return res.status(400).json({ error: "Password must be at least 8 characters." });
    next.passwordHash = hashPassword(req.body.password);
  }
  sellers[index] = next;
  writeSellers(sellers);
  res.json(sanitizeSeller(next));
});

app.delete("/api/admin/sellers/:id", requireAuth, (req, res) => {
  const sellers = readSellers();
  if (!sellers.some((entry) => entry.id === req.params.id)) return res.status(404).json({ error: "Seller not found." });
  writeSellers(sellers.filter((entry) => entry.id !== req.params.id));
  const shops = readShops().map((shop) => shop.ownerId === req.params.id
    ? { ...shop, ownerId: null, ownerName: "Rivoshoppa Admin", sellerBusinessName: shop.name }
    : shop);
  writeShops(shops);
  res.json({ ok: true });
});
app.patch("/api/admin/orders/:id/status", requireAuth, async (req, res) => {
  const { status } = req.body;
  if (!STATUS_STEPS.includes(status)) {
    return res.status(400).json({ error: `status must be one of ${STATUS_STEPS.join(", ")}` });
  }

  const orders = readOrders();
  const order = orders.find((o) => o.id === req.params.id.toUpperCase());
  if (!order) return res.status(404).json({ error: "Not found" });

  order.status = status;
  order.history.push({ status, at: new Date().toISOString() });
  writeOrders(orders);

  notifyContact(
    order.contact,
    `Rivoshoppa order ${order.id}: ${STATUS_LABEL[status]}`,
    `Update on order ${order.id}: it's now ${STATUS_LABEL[status].toLowerCase()}. Track it any time with your order id.`
  ).catch(() => {});

  res.json(order);
});

if (require.main === module) {
  const server = app.listen(PORT, () => {
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : PORT;
    console.log(`Rivoshoppa API running on http://localhost:${port}`);
    console.log(`Admin login: ${process.env.ADMIN_USER || "admin"} / ${process.env.ADMIN_PASS || "safesend123"} (change via .env)`);
  });

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      console.error(`Port ${PORT} is already in use. Stop the existing Rivoshoppa server or start with a different PORT.`);
      process.exitCode = 1;
      return;
    }
    throw error;
  });
}

module.exports = { app };