import clientPromise from "lib/mongodb";
import { serialize } from "cookie";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { password } = req.body;
  if (!password) return res.status(400).json({ error: "Password required" });

  try {
    const client = await clientPromise;
    const db = client.db("panna145");
    const admin = await db.collection("admin").findOne({ username: "admin" });

    if (!admin || admin.password !== password.trim()) {
      return res.status(401).json({ error: "Wrong password" });
    }

    const cookie = serialize("admin-auth", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24,
      path: "/",
      sameSite: "Lax",
    });

    res.setHeader("Set-Cookie", cookie);
    return res.status(200).json({ message: "Login successful" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}
