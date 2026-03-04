import clientPromise from "lib/mongodb";
import { serialize } from "cookie";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { moderatorId, password } = req.body;
  if (!moderatorId || !password)
    return res.status(400).json({ error: "ID and password required" });

  try {
    const client = await clientPromise;
    const db = client.db("panna145");
    const mod = await db
      .collection("moderator")
      .findOne({ moderatorId: moderatorId.trim() });

    if (!mod) return res.status(404).json({ error: "Moderator not found" });
    if (mod.password !== password.trim())
      return res.status(401).json({ error: "Wrong password" });
    if (!mod.active) return res.status(403).json({ error: "Account disabled" });

    const cookieVal = JSON.stringify({
      moderatorId: mod.moderatorId,
    });

    const cookie = serialize("moderator-auth", cookieVal, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24,
      path: "/",
      sameSite: "Lax",
    });

    res.setHeader("Set-Cookie", cookie);
    return res.status(200).json({
      moderatorId: mod.moderatorId,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}
