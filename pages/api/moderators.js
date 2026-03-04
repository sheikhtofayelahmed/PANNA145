import clientPromise from "lib/mongodb";

export default async function handler(req, res) {
  const client = await clientPromise;
  const db = client.db("panna145");
  const col = db.collection("moderator");

  // GET — list all moderators
  if (req.method === "GET") {
    const list = await col
      .find({}, { projection: { password: 0, _id: 0 } })
      .toArray();
    return res.status(200).json({ moderators: list });
  }

  // POST — create moderator
  if (req.method === "POST") {
    const { moderatorId, password } = req.body;
    if (!moderatorId?.trim() || !password?.trim())
      return res.status(400).json({ error: "Moderator ID and password required" });

    const exists = await col.findOne({ moderatorId: moderatorId.trim() });
    if (exists)
      return res.status(409).json({ error: "Moderator ID already exists" });

    await col.insertOne({
      moderatorId: moderatorId.trim(),
      password: password.trim(),
      active: true,
    });
    return res.status(201).json({ message: "Moderator created" });
  }

  // PUT — update moderator (password, active)
  if (req.method === "PUT") {
    const { moderatorId, password, active } = req.body;
    if (!moderatorId)
      return res.status(400).json({ error: "moderatorId required" });

    const update = {};
    if (password?.trim()) update.password = password.trim();
    if (active !== undefined) update.active = Boolean(active);

    await col.updateOne({ moderatorId }, { $set: update });
    return res.status(200).json({ message: "Updated" });
  }

  // DELETE — remove moderator
  if (req.method === "DELETE") {
    const { moderatorId } = req.body;
    if (!moderatorId)
      return res.status(400).json({ error: "moderatorId required" });
    await col.deleteOne({ moderatorId });
    return res.status(200).json({ message: "Deleted" });
  }

  return res.status(405).end();
}
