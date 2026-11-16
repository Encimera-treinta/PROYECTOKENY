import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

const MERCHANT_ID = process.env.YAPPY_MERCHANT_ID;
const SECRET_KEY = process.env.YAPPY_SECRET_KEY;
const DOMAIN = normalizeDomain(process.env.YAPPY_DOMAIN || "");
const TEST_MODE = process.env.YAPPY_ENVIRONMENT === "test";
const API_BASE = TEST_MODE
  ? "https://api-comecom-uat.yappycloud.com"
  : "https://apipagosbg.bgeneral.cloud";

export type YappyPaymentSession = {
  transactionId: string;
  token: string;
  documentName: string;
};

function normalizeDomain(value: string): string {
  try {
    const parsed = new URL(value.includes("://") ? value : `https://${value}`);
    if (parsed.protocol !== "https:" || parsed.pathname !== "/" || parsed.search || parsed.hash) return "";
    return parsed.origin;
  } catch {
    return "";
  }
}

type YappyApiResponse<T> = {
  status?: { code?: string | number; description?: string };
  body?: T;
};

export function isYappyConfigured() {
  return Boolean(
    MERCHANT_ID && SECRET_KEY && DOMAIN && (!TEST_MODE || process.env.YAPPY_TEST_ALIAS)
  );
}

export function getYappyButtonScriptUrl() {
  return TEST_MODE
    ? "https://bt-cdn-uat.yappycloud.com/v1/cdn/web-component-btn-yappy.js"
    : "https://bt-cdn.yappy.cloud/v1/cdn/web-component-btn-yappy.js";
}

export async function createYappyPaymentOrder(
  orderId: string,
  subtotal: number,
  total: number
): Promise<YappyPaymentSession> {
  if (!isYappyConfigured() || !MERCHANT_ID || !DOMAIN) {
    throw new Error("Yappy Comercial no está configurado.");
  }

  if (!orderId || orderId.length > 15) {
    throw new Error("El identificador del pedido no cumple el límite de Yappy.");
  }

  const validationResponse = await fetch(
    `${API_BASE}/payments/validate/merchant`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ merchantId: MERCHANT_ID, urlDomain: DOMAIN }),
      cache: "no-store",
    }
  );

  const validation = (await validationResponse.json()) as YappyApiResponse<{
    token?: string;
  }>;
  const sessionToken = validation.body?.token;

  if (!validationResponse.ok || !sessionToken) {
    throw new Error(
      `Yappy no pudo validar el comercio (${validationResponse.status}).`
    );
  }

  const paymentBody: Record<string, string | number> = {
    merchantId: MERCHANT_ID,
    orderId,
    domain: DOMAIN,
    paymentDate: Date.now(),
    ipnUrl: `https://${DOMAIN}/api/yappy/ipn`,
    discount: "0.00",
    taxes: "0.00",
    subtotal: subtotal.toFixed(2),
    total: total.toFixed(2),
  };

  if (TEST_MODE) {
    paymentBody.aliasYappy = process.env.YAPPY_TEST_ALIAS!;
  }

  const paymentResponse = await fetch(`${API_BASE}/payments/payment-wc`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: sessionToken,
    },
    body: JSON.stringify(paymentBody),
    cache: "no-store",
  });

  const payment = (await paymentResponse.json()) as YappyApiResponse<{
    transactionId?: string | number;
    token?: string;
    documentName?: string;
  }>;
  const transactionId = payment.body?.transactionId;
  const token = payment.body?.token;
  const documentName = payment.body?.documentName;

  if (!paymentResponse.ok || !transactionId || !token || !documentName) {
    throw new Error(
      `Yappy no pudo crear la solicitud de pago (${paymentResponse.status}).`
    );
  }

  return {
    transactionId: String(transactionId),
    token,
    documentName,
  };
}

export function verifyYappyIpn(input: {
  orderId: string;
  status: string;
  hash: string;
  domain: string;
}): boolean {
  const callbackDomain = normalizeDomain(input.domain);
  if (!SECRET_KEY || !DOMAIN || !callbackDomain || callbackDomain.toLowerCase() !== DOMAIN.toLowerCase()) {
    return false;
  }

  let signingKey: string;
  try {
    signingKey = Buffer.from(SECRET_KEY, "base64").toString("utf8").split(".")[0];
  } catch {
    return false;
  }

  if (!signingKey || !/^[a-f0-9]{64}$/i.test(input.hash)) return false;

  const expected = createHmac("sha256", signingKey)
    .update(`${input.orderId}${input.status}${input.domain}`)
    .digest();
  const received = Buffer.from(input.hash, "hex");

  return received.length === expected.length && timingSafeEqual(received, expected);
}
