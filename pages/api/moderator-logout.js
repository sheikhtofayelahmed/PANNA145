import { serialize } from "cookie";

export default function handler(req, res) {
  res.setHeader(
    "Set-Cookie",
    serialize("moderator-auth", "", { maxAge: 0, path: "/" })
  );
  return res.status(200).json({ message: "Logged out" });
}
