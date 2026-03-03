import clientPromise from "lib/mongodb";
import { serialize } from "cookie";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { moderatorId, password } = req.body;

  if (!moderatorId || !password) {
    return res
      .status(400)
      .json({ error: "Moderator ID and password are required" });
  }

  try {
    const client = await clientPromise;
    const db = client.db("noshib786");

    const moderator = await db
      .collection("moderator")
      .findOne({ moderatorId: moderatorId.trim() });

    if (!moderator) {
      return res.status(404).json({ error: "Moderator not found" });
    }

    // Plain text password comparison (matching existing storage pattern)
    if (moderator.password !== password.trim()) {
      return res.status(401).json({ error: "Wrong password" });
    }

    if (!moderator.active) {
      return res.status(403).json({ error: "Moderator account is disabled" });
    }

    // Set authentication cookie with moderator data
    const cookieValue = JSON.stringify({
      moderatorId: moderator.moderatorId,
      assignedAgent: moderator.assignedAgent,
    });

    const cookie = serialize("moderator-auth-N786", cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
      sameSite: "Lax",
    });

    res.setHeader("Set-Cookie", cookie);

    return res.status(200).json({
      message: "Login successful",
      moderatorId: moderator.moderatorId,
      assignedAgent: moderator.assignedAgent,
    });
  } catch (err) {
    console.error("Moderator login error:", err);
    return res.status(500).json({ error: "Server error during login" });
  }
}
