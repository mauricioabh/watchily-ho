import { createHmac } from "node:crypto";

function base64url(value) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function signJwt(payload, secret) {
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64url(JSON.stringify(payload));
  const signature = createHmac("sha256", secret)
    .update(`${header}.${body}`)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  return `${header}.${body}.${signature}`;
}

const secret = process.env.JWT_SECRET;
if (!secret) {
  console.error("JWT_SECRET is required to mint local Supabase JWT keys");
  process.exit(1);
}

const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365;
const anon = signJwt({ iss: "supabase-demo", role: "anon", exp }, secret);
const service = signJwt(
  { iss: "supabase-demo", role: "service_role", exp },
  secret,
);

console.log(`SUPABASE_ANON_KEY=${anon}`);
console.log(`SUPABASE_SERVICE_ROLE_KEY=${service}`);
