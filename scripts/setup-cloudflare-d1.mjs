// One-time, idempotent D1 bootstrap for GitHub Actions.
// No tokens or generated database IDs are committed to git.
import { readFileSync, writeFileSync } from "node:fs";

const apiToken = process.env.CLOUDFLARE_API_TOKEN;
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const databaseName = "cloudmark-christorng";

if (!apiToken || !accountId) {
  throw new Error("Missing CLOUDFLARE_API_TOKEN or CLOUDFLARE_ACCOUNT_ID.");
}

async function request(path, init = {}) {
  const response = await fetch("https://api.cloudflare.com/client/v4" + path, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiToken}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
    },
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    const message = data.errors?.map(error => error.message).join("; ") || response.statusText;
    throw new Error(`Cloudflare API error ${response.status}: ${message}`);
  }
  return data;
}

let database;
for (let page = 1; ; page++) {
  const payload = await request(
    `/accounts/${encodeURIComponent(accountId)}/d1/database?page=${page}&per_page=100`
  );
  database = payload.result.find(item => item.name === databaseName);
  if (database || page >= (payload.result_info?.total_pages || 1)) break;
}

let uuid = database?.uuid;
if (!uuid) {
  const payload = await request(
    `/accounts/${encodeURIComponent(accountId)}/d1/database`,
    {
      method: "POST",
      body: JSON.stringify({ name: databaseName, primary_location_hint: "apac" }),
    },
  );
  uuid = payload.result?.uuid;
  console.log("Created D1 database:", databaseName);
} else {
  console.log("Reusing existing D1 database:", databaseName);
}

if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid ?? "")) {
  throw new Error("Cloudflare did not return a valid D1 database UUID.");
}

const path = "wrangler.jsonc";
const config = readFileSync(path, "utf8");
const idPattern = /("database_id"\s*:\s*")[^"]*(")/g;
if ([...config.matchAll(idPattern)].length !== 1) {
  throw new Error("Expected exactly one database_id in wrangler.jsonc.");
}
writeFileSync(path, config.replace(idPattern, (_match, prefix, suffix) => prefix + uuid + suffix));
console.log("Configured D1 binding for this deployment; Git files are unchanged.");
