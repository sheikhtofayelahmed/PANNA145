import clientPromise from "lib/mongodb";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();
  try {
    const client = await clientPromise;
    const db = client.db("panna145");
    const agents = await db
      .collection("agents")
      .find({}, { projection: { _id: 0 } })
      .sort({ serial: 1 })
      .toArray();
    return res.status(200).json({ agents });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}
