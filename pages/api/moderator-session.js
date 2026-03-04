import clientPromise from "lib/mongodb";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  const cookie = req.cookies["moderator-auth"];
  if (!cookie) return res.status(401).json({ error: "Not authenticated" });

  try {
    const session = JSON.parse(cookie);
    if (!session.moderatorId)
      return res.status(401).json({ error: "Invalid session" });

    const client = await clientPromise;
    const db = client.db("panna145");
    const mod = await db
      .collection("moderator")
      .findOne(
        { moderatorId: session.moderatorId },
        { projection: { active: 1 } },
      );

    if (!mod) return res.status(401).json({ error: "Not found" });
    if (!mod.active) return res.status(403).json({ error: "Account disabled" });

    return res.status(200).json({
      moderatorId: session.moderatorId,
    });
  } catch {
    return res.status(401).json({ error: "Invalid session" });
  }
}
