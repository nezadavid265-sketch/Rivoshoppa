const crypto = require("crypto");

const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASS = process.env.ADMIN_PASS || "safesend123";

const activeTokens = new Set();
const sellerTokens = new Map();

function checkCredentials(username, password) {
  return username === ADMIN_USER && password === ADMIN_PASS;
}

function issueToken() {
  const token = crypto.randomBytes(24).toString("hex");
  activeTokens.add(token);
  return token;
}

function revokeToken(token) {
  activeTokens.delete(token);
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token || !activeTokens.has(token)) {
    return res.status(401).json({ error: "Unauthorized. Please log in again." });
  }
  next();
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(String(password), salt, 64).toString("hex");
  return `scrypt:${salt}:${derived}`;
}

function verifyPassword(password, storedHash) {
  try {
    const [scheme, salt, expected] = String(storedHash || "").split(":");
    if (scheme !== "scrypt" || !salt || !expected) return false;
    const actual = crypto.scryptSync(String(password), salt, 64).toString("hex");
    return crypto.timingSafeEqual(Buffer.from(actual, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

function issueSellerToken(sellerId) {
  const token = crypto.randomBytes(32).toString("hex");
  sellerTokens.set(token, sellerId);
  return token;
}

function revokeSellerToken(token) {
  sellerTokens.delete(token);
}

function requireSellerAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  const sellerId = token ? sellerTokens.get(token) : null;

  if (!token || !sellerId) {
    return res.status(401).json({ error: "Seller authentication required. Please log in again." });
  }

  req.sellerId = sellerId;
  req.sellerToken = token;
  next();
}

module.exports = {
  checkCredentials,
  issueToken,
  revokeToken,
  requireAuth,
  hashPassword,
  verifyPassword,
  issueSellerToken,
  revokeSellerToken,
  requireSellerAuth,
};
