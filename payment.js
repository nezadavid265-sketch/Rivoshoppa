const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PAYMENTS_DATA_FILE = path.join(__dirname, "data", "payments.json");

const PROVIDER_LABELS = {
  mtn_mobile_money: "MTN MoMo",
  airtel_money: "Airtel Money",
};

function readJson(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const raw = fs.readFileSync(filePath, "utf-8").trim();
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (error) {
    return fallback;
  }
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function readPayments() {
  return readJson(PAYMENTS_DATA_FILE, []);
}

function writePayments(payments) {
  writeJson(PAYMENTS_DATA_FILE, payments);
}

function normalizeRwandaMsisdn(value) {
  const raw = String(value || "").trim();
  const digits = raw.replace(/\D/g, "");

  if (!digits) return null;
  if (digits.startsWith("250") && digits.length === 12) return `+${digits}`;
  if (digits.startsWith("0") && digits.length === 10) return `+250${digits.slice(1)}`;
  if (digits.length === 9) return `+250${digits}`;
  return null;
}

function isValidRwandaMobileMoney(value) {
  const normalized = normalizeRwandaMsisdn(value);
  return Boolean(normalized && /^\+250[0-9]{9}$/.test(normalized));
}

function buildPaymentReference(orderId) {
  return `PAY-${String(orderId || "ORDER").replace(/[^A-Z0-9-]/gi, "").toUpperCase()}-${Date.now()}-${crypto.randomInt(1000, 9999)}`;
}

function getProviderConfig(provider) {
  switch (provider) {
    case "mtn_mobile_money":
      return {
        name: "MTN MoMo",
        baseUrl: process.env.MTN_API_BASE_URL || "",
        apiUserId: process.env.MTN_API_USER_ID || "",
        apiKey: process.env.MTN_API_KEY || "",
        subscriptionKey: process.env.MTN_SUBSCRIPTION_KEY || "",
        environment: process.env.MTN_ENVIRONMENT || "sandbox",
        callbackUrl: process.env.MTN_CALLBACK_URL || "",
        secret: process.env.MTN_CALLBACK_SECRET || "",
      };
    case "airtel_money":
      return {
        name: "Airtel Money",
        baseUrl: process.env.AIRTEL_API_BASE_URL || "",
        clientId: process.env.AIRTEL_CLIENT_ID || "",
        clientSecret: process.env.AIRTEL_CLIENT_SECRET || "",
        merchantId: process.env.AIRTEL_MERCHANT_ID || "",
        environment: process.env.AIRTEL_ENVIRONMENT || "sandbox",
        callbackUrl: process.env.AIRTEL_CALLBACK_URL || "",
        secret: process.env.AIRTEL_CALLBACK_SECRET || "",
      };
    default:
      return null;
  }
}

function validateProviderAndPhone(provider, phone, amount, currency) {
  if (!provider || !PROVIDER_LABELS[provider]) {
    throw new Error("Choose a supported provider: MTN Mobile Money or Airtel Money.");
  }

  if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
    throw new Error("The payment amount must be greater than zero.");
  }

  if (String(currency || "").toUpperCase() !== "RWF") {
    throw new Error("Rivoshoppa payments must use RWF currency.");
  }

  if (!isValidRwandaMobileMoney(phone)) {
    throw new Error(`Enter a valid Rwanda mobile-money number for ${PROVIDER_LABELS[provider]}.`);
  }
}

async function getMtnAccessToken() {
  const config = getProviderConfig("mtn_mobile_money");
  if (!config || !config.baseUrl || !config.apiUserId || !config.apiKey) {
    throw new Error("MTN Mobile Money is not configured. Add MTN_API_BASE_URL, MTN_API_USER_ID, MTN_API_KEY, and MTN_SUBSCRIPTION_KEY to .env.");
  }

  const password = Buffer.from(`${config.apiUserId}:${config.apiKey}`).toString("base64");
  const response = await fetch(`${config.baseUrl.replace(/\/+$/, "")}/collection/token/`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${password}`,
      "Ocp-Apim-Subscription-Key": config.subscriptionKey,
      "Content-Type": "application/json",
    },
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : await response.text();

  if (!response.ok) {
    throw new Error(payload?.message || payload || "MTN token request failed.");
  }

  if (!payload || !payload.access_token) {
    throw new Error("MTN token response did not include an access token.");
  }

  return payload.access_token;
}

async function createMtnPaymentRequest({ orderId, amount, currency, phone, reference, note }) {
  const config = getProviderConfig("mtn_mobile_money");
  if (!config || !config.baseUrl) {
    throw new Error("MTN Mobile Money is not configured. Add MTN_API_BASE_URL and related credentials to .env.");
  }

  const accessToken = await getMtnAccessToken();
  const msisdn = normalizeRwandaMsisdn(phone);
  const payload = {
    amount: String(Number(amount).toFixed(0)),
    currency: String(currency).toUpperCase(),
    externalId: reference,
    payer: {
      partyIdType: "MSISDN",
      partyId: msisdn.replace("+", ""),
    },
    payerMessage: note || `Rivoshoppa order ${orderId}`,
    payeeNote: note || `Rivoshoppa order ${orderId}`,
  };

  const response = await fetch(`${config.baseUrl.replace(/\/+$/, "")}/collection/v1_0/requesttopay`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "X-Reference-Id": reference,
      "X-Target-Environment": config.environment,
      "Ocp-Apim-Subscription-Key": config.subscriptionKey,
      "Content-Type": "application/json",
      ...(config.callbackUrl ? { "X-Callback-Url": config.callbackUrl } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (response.status !== 202) {
    const contentType = response.headers.get("content-type") || "";
    const text = contentType.includes("application/json") ? await response.json() : await response.text();
    throw new Error(text?.message || text || "MTN request to pay failed.");
  }

  const providerReference = response.headers.get("x-reference-id") || reference;
  return {
    provider: "mtn_mobile_money",
    status: "PENDING",
    reference,
    providerReference,
    payer: msisdn,
    amount: Number(amount),
    currency: String(currency).toUpperCase(),
    nextAction: "Approve the payment on your phone to complete checkout.",
  };
}

async function createAirtelPaymentRequest({ orderId, amount, currency, phone, reference, note }) {
  const config = getProviderConfig("airtel_money");
  if (!config || !config.baseUrl || !config.clientId || !config.clientSecret) {
    throw new Error("Airtel Money is not configured. Add AIRTEL_API_BASE_URL, AIRTEL_CLIENT_ID, AIRTEL_CLIENT_SECRET, and AIRTEL_MERCHANT_ID to .env.");
  }

  const auth = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64");
  const msisdn = normalizeRwandaMsisdn(phone);
  const payload = {
    reference,
    subscriber: {
      country: "RW",
      currency: String(currency).toUpperCase(),
      msisdn: msisdn.replace("+", ""),
    },
    transaction: {
      amount: Number(amount),
      currency: String(currency).toUpperCase(),
      id: reference,
      type: "PAYMENT",
    },
    description: note || `Rivoshoppa order ${orderId}`,
  };

  const response = await fetch(`${config.baseUrl.replace(/\/+$/, "")}/merchant/v1/payments`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
      "X-Country": "RW",
      "X-Currency": String(currency).toUpperCase(),
      "X-Partner-Id": config.merchantId || config.clientId,
      ...(config.callbackUrl ? { "X-Callback-Url": config.callbackUrl } : {}),
    },
    body: JSON.stringify(payload),
  });

  const contentType = response.headers.get("content-type") || "";
  const body = contentType.includes("application/json") ? await response.json() : await response.text();

  if (!response.ok) {
    throw new Error(body?.message || body || "Airtel request to pay failed.");
  }

  const providerReference = body?.data?.transaction?.id || body?.reference || reference;
  return {
    provider: "airtel_money",
    status: "PENDING",
    reference,
    providerReference,
    payer: msisdn,
    amount: Number(amount),
    currency: String(currency).toUpperCase(),
    nextAction: "Approve the payment on your phone to complete checkout.",
  };
}

async function createPaymentIntent({ orderId, provider, amount, currency = "RWF", phone, note }) {
  validateProviderAndPhone(provider, phone, amount, currency);
  const reference = buildPaymentReference(orderId);

  if (provider === "mtn_mobile_money") {
    return createMtnPaymentRequest({ orderId, amount, currency, phone, reference, note });
  }

  if (provider === "airtel_money") {
    return createAirtelPaymentRequest({ orderId, amount, currency, phone, reference, note });
  }

  throw new Error("Unsupported payment provider.");
}

function upsertPayment(payment) {
  const payments = readPayments();
  const index = payments.findIndex((entry) => entry.reference === payment.reference || entry.orderId === payment.orderId);

  if (index >= 0) {
    payments[index] = { ...payments[index], ...payment, updatedAt: new Date().toISOString() };
  } else {
    payments.push({
      id: `PAYMENT-${Date.now()}-${crypto.randomInt(1000, 9999)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...payment,
    });
  }

  writePayments(payments);
  return payments[index >= 0 ? index : payments.length - 1];
}

function getPaymentByReference(reference) {
  const payments = readPayments();
  return payments.find((payment) => payment.reference === reference || payment.providerReference === reference) || null;
}

function normalizePaymentStatus(value) {
  const status = String(value || "").trim().toUpperCase();
  const allowed = new Set(["PENDING", "SUCCESSFUL", "FAILED", "CANCELLED", "EXPIRED"]);
  return allowed.has(status) ? status : "FAILED";
}

function safePaymentResponse(payment) {
  return {
    id: payment.id,
    orderId: payment.orderId,
    provider: payment.provider,
    amount: payment.amount,
    currency: payment.currency,
    status: payment.status,
    reference: payment.reference,
    providerReference: payment.providerReference,
    payer: payment.payer,
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
    nextAction: payment.nextAction,
    requiresConfiguration: Boolean(payment.requiresConfiguration),
    providerMessage: payment.providerMessage,
  };
}

module.exports = {
  PROVIDER_LABELS,
  normalizeRwandaMsisdn,
  isValidRwandaMobileMoney,
  buildPaymentReference,
  getProviderConfig,
  createPaymentIntent,
  upsertPayment,
  getPaymentByReference,
  normalizePaymentStatus,
  safePaymentResponse,
  readPayments,
  writePayments,
};
