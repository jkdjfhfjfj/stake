import { db, platformSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "./logger";

const PAYHERO_BASE = "https://backend.payhero.co.ke/api/v2";

async function getSettings() {
  const rows = await db.select().from(platformSettingsTable);
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    username: map["payhero_username"] ?? "",
    password: map["payhero_password"] ?? "",
    channelId: map["payhero_channel_id"] ?? "",
  };
}

function basicAuth(username: string, password: string) {
  return "Basic " + Buffer.from(`${username}:${password}`).toString("base64");
}

export async function initiateSTKPush(params: {
  amount: number;
  phoneNumber: string;
  reference: string;
  description: string;
  callbackUrl: string;
}) {
  const { username, password, channelId } = await getSettings();
  if (!username || !password) {
    throw new Error("PayHero credentials not configured. Set them in admin settings.");
  }

  const body = {
    amount: params.amount,
    phone_number: params.phoneNumber,
    channel_id: channelId,
    provider: "m-pesa",
    external_reference: params.reference,
    customer_name: "Customer",
    callback_url: params.callbackUrl,
    description: params.description,
  };

  logger.info({ ref: params.reference, amount: params.amount }, "Initiating STK push");

  const res = await fetch(`${PAYHERO_BASE}/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: basicAuth(username, password),
    },
    body: JSON.stringify(body),
  });

  const data = await res.json() as Record<string, unknown>;

  if (!res.ok) {
    logger.error({ status: res.status, data }, "PayHero STK push failed");
    throw new Error(`PayHero error: ${JSON.stringify(data)}`);
  }

  return data;
}

export async function disburseB2C(params: {
  amount: number;
  phoneNumber: string;
  reference: string;
  callbackUrl: string;
}) {
  const { username, password, channelId } = await getSettings();
  if (!username || !password) {
    throw new Error("PayHero credentials not configured. Set them in admin settings.");
  }

  const body = {
    external_reference: params.reference,
    amount: params.amount,
    phone_number: params.phoneNumber,
    channel_id: channelId,
    provider: "m-pesa",
    callback_url: params.callbackUrl,
  };

  logger.info({ ref: params.reference, amount: params.amount }, "Initiating B2C disbursement");

  const res = await fetch(`${PAYHERO_BASE}/withdraw`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: basicAuth(username, password),
    },
    body: JSON.stringify(body),
  });

  const data = await res.json() as Record<string, unknown>;

  if (!res.ok) {
    logger.error({ status: res.status, data }, "PayHero B2C disbursement failed");
    throw new Error(`PayHero withdrawal error: ${JSON.stringify(data)}`);
  }

  return data;
}
