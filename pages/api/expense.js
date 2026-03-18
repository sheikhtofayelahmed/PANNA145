import clientPromise from "lib/mongodb";

export default async function handler(req, res) {
  const client = await clientPromise;
  const db = client.db("panna145");
  const col = db.collection("expense");

  if (req.method === "GET") {
    const doc = await col.findOne({});
    return res.status(200).json({
      winAmount: doc?.winAmount ?? 0,
      winLabel: doc?.winLabel || "LOST",
      gameAmount: doc?.gameAmount ?? 0,
      gameLabel: doc?.gameLabel || "GET",
    });
  }

  if (req.method === "PUT") {
    const { winAmount, winLabel, gameAmount, gameLabel } = req.body;
    await col.updateOne(
      {},
      {
        $set: {
          winAmount: Number(winAmount ?? 0),
          winLabel: winLabel || "LOST",
          gameAmount: Number(gameAmount ?? 0),
          gameLabel: gameLabel || "GET",
        },
      },
      { upsert: true }
    );
    return res.status(200).json({ message: "Updated" });
  }

  return res.status(405).end();
}
