import clientPromise from "lib/mongodb";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const cookie = req.cookies["moderator-auth-N786"];

    if (!cookie) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const session = JSON.parse(cookie);

    if (!session.moderatorId) {
      return res.status(401).json({ error: "Invalid session" });
    }

    // Always fetch the latest assignedAgent from the database
    // so admin reassignments are reflected in real time
    const client = await clientPromise;
    const db = client.db("noshib786");
    const moderator = await db
      .collection("moderator")
      .findOne(
        { moderatorId: session.moderatorId },
        { projection: { assignedAgent: 1, active: 1 } },
      );

    if (!moderator) {
      return res.status(401).json({ error: "Moderator not found" });
    }

    if (!moderator.active) {
      return res.status(403).json({ error: "Moderator account is disabled" });
    }

    return res.status(200).json({
      moderatorId: session.moderatorId,
      assignedAgent: moderator.assignedAgent || "",
    });
  } catch (err) {
    console.error("Moderator session error:", err);
    return res.status(401).json({ error: "Invalid session" });
  }
}
