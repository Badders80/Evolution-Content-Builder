import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";

const SA_KEY_PATH = path.join(process.cwd(), "keys", "service-account.json");

export function generateVertexSearchJWT() {
  const sa = JSON.parse(fs.readFileSync(SA_KEY_PATH, "utf8"));

  const now = Math.floor(Date.now() / 1000);

  const payload = {
    iss: sa.client_email,
    sub: sa.client_email,
    aud: "https://gen-app-builder.googleapis.com",
    iat: now,
    exp: now + 3600, // 1 hour
  };

  return jwt.sign(payload, sa.private_key, { algorithm: "RS256" });
}
