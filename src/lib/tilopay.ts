import "server-only";

const API_BASE =
  process.env.TILOPAY_API_BASE || "https://app.tilopay.com";

const CHECKOUT_KEY = process.env.TILOPAY_CHECKOUT_KEY;
const API_USER = process.env.TILOPAY_API_USER;
const API_PASSWORD = process.env.TILOPAY_API_PASSWORD;
const CURRENCY = process.env.TILOPAY_CURRENCY || "USD";

export function isTiloPayConfigured() {
  return Boolean(CHECKOUT_KEY && API_USER && API_PASSWORD);
}

type TokenCache = {
  token: string;
  expiresAt: number;
};

const globalTokens = globalThis as typeof globalThis & {
  tilopayApiToken?: TokenCache;
};

async function getApiToken(): Promise<string> {
  const cached = globalTokens.tilopayApiToken;

  if (cached && cached.expiresAt > Date.now() + 60_000) {
    return cached.token;
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE}/api/v1/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiuser: API_USER,
        password: API_PASSWORD,
      }),
      cache: "no-store",
    });
  } catch (error) {
    throw new Error(
      `TiloPay login no alcanzable: ${
        error instanceof Error ? error.message : "desconocido"
      }`
    );
  }

  if (!response.ok) {
    throw new Error(`TiloPay login falló: ${response.status}`);
  }

  const data = (await response.json()) as {
    access_token: string;
    expires_in: number;
  };

  globalTokens.tilopayApiToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return data.access_token;
}

export type TiloPayPaymentRequest = {
  amount: string;
  orderNumber: string;
  redirectUrl: string;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
};

export async function createPaymentPage(
  request: TiloPayPaymentRequest
): Promise<string> {
  const token = await getApiToken();

  const body = {
    redirect: request.redirectUrl,
    key: CHECKOUT_KEY,
    amount: request.amount,
    currency: CURRENCY,
    orderNumber: request.orderNumber,
    capture: "1",
    billToFirstName: request.customer.firstName,
    billToLastName: request.customer.lastName,
    billToAddress: request.customer.address || "Ciudad de Panamá",
    billToAddress2: "",
    billToCity: request.customer.city || "Panamá",
    billToState: request.customer.state || "PA",
    billToZipPostCode: request.customer.zip || "00000",
    billToCountry: request.customer.country || "PA",
    billToTelephone: request.customer.phone || "00000000",
    billToEmail: request.customer.email,
    shipToFirstName: request.customer.firstName,
    shipToLastName: request.customer.lastName,
    shipToAddress: request.customer.address || "Ciudad de Panamá",
    shipToAddress2: "",
    shipToCity: request.customer.city || "Panamá",
    shipToState: request.customer.state || "PA",
    shipToZipPostCode: request.customer.zip || "00000",
    shipToCountry: request.customer.country || "PA",
    shipToTelephone: request.customer.phone || "00000000",
    subscription: "0",
    platform: "sportcrz",
    returnData: Buffer.from(request.orderNumber).toString("base64"),
    hashVersion: "V2",
    token_version: "v2",
  };

  const response = await fetch(`${API_BASE}/api/v1/processPayment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `bearer ${token}`,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const data = (await response.json()) as {
    type?: string;
    url?: string;
    html?: string;
    message?: string;
  };

  if (!response.ok || !data.url) {
    throw new Error(
      `TiloPay processPayment falló: ${response.status} ${
        data.message || data.html || "sin URL"
      }`
    );
  }

  return data.url;
}

export type TiloPayTransaction = {
  orderNumber?: string;
  amount?: string | number;
  currency?: string;
  code?: string;
  auth?: string;
  id_tilopay?: string | number;
  capture?: string;
  environment?: string;
  card?: string;
  last?: string;
  payment_method?: string;
  paymentMethod?: string;
  method?: string;
};

/**
 * The redirect back to our site is customer-controlled. Query Tilopay's API
 * from the server before changing an order to paid or cancelled.
 */
export async function consultPayment(
  orderNumber: string
): Promise<TiloPayTransaction | undefined> {
  if (!isTiloPayConfigured()) return undefined;

  const token = await getApiToken();
  const response = await fetch(`${API_BASE}/api/v1/consult`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `bearer ${token}`,
    },
    body: JSON.stringify({ key: CHECKOUT_KEY, orderNumber }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`TiloPay consult falló: ${response.status}`);
  }

  const data = (await response.json()) as {
    type?: string;
    response?: TiloPayTransaction[];
  };

  if (data.type !== "200" || !Array.isArray(data.response)) {
    throw new Error("TiloPay consult devolvió una respuesta inválida.");
  }

  return data.response.find(
    (transaction) => transaction.orderNumber === orderNumber
  );
}
