import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";

let client: PlaidApi | null = null;

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export function getPlaidClient(): PlaidApi {
  if (client) return client;

  const env = (process.env.PLAID_ENV || "sandbox").toLowerCase();
  const basePath =
    env === "production"
      ? PlaidEnvironments.production
      : env === "development"
        ? PlaidEnvironments.development
        : PlaidEnvironments.sandbox;

  const config = new Configuration({
    basePath,
    baseOptions: {
      headers: {
        "PLAID-CLIENT-ID": requireEnv("PLAID_CLIENT_ID"),
        "PLAID-SECRET": requireEnv("PLAID_SECRET"),
      },
    },
  });

  client = new PlaidApi(config);
  return client;
}

export function getPlaidWebhookUrl(): string | undefined {
  const url = process.env.PLAID_WEBHOOK_URL;
  return url && url.length > 0 ? url : undefined;
}
