import clientPromise from "lib/mongodb";

export default async function handler(req, res) {
  const client = await clientPromise;
  const db = client.db("panna145");
  const col = db.collection("expense");

  if (req.method === "GET") {
    const doc = await col.findOne({});
    return res.status(200).json({
      amount: doc?.amount ?? 0,
      label: doc?.label || "Expense",
    });
  }

  if (req.method === "PUT") {
    const { amount, label } = req.body;
    await col.updateOne(
      {},
      {
        $set: {
          amount: Number(amount ?? 0),
          label: label || "Expense",
        },
      },
      { upsert: true }
    );
    return res.status(200).json({ message: "Updated" });
  }

  return res.status(405).end();
}
