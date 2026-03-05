import { parse } from "cookie";

export default function handler(req, res) {
  const cookies = parse(req.headers.cookie || "");
  if (cookies["admin-auth"] !== "true") {
    return res.status(401).json({ error: "Unauthorized" });
  }
  return res.status(200).json({ admin: true });
}
