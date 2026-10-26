const { ObjectId } = require("mongodb");

const createPaymentControllers = (
  parcelsCollection,
  paymentsCollection,
  stripe,
) => {
  const createPaymentIntent = async (req, res) => {
    const amountInCents = req.body.amountInCents;
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: "usd",
        payment_method_types: ["card"],
      });

      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    } catch (error) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ message: "Failed to create payment intent" });
    }
  };

  const recordPayment = async (req, res) => {
    try {
      const { parcelId, email, amount, paymentMethod, transactionId } =
        req.body;

      // 1. Update parcel's payment_status
      const updateResult = await parcelsCollection.updateOne(
        { _id: new ObjectId(parcelId) },
        {
          $set: {
            payment_status: "paid",
          },
        },
      );

      if (updateResult.modifiedCount === 0) {
        return res
          .status(404)
          .send({ message: "Parcel not found or already paid" });
      }

      // 2. Insert payment record
      const paymentDoc = {
        parcelId,
        email,
        amount,
        paymentMethod,
        transactionId,
        paid_at_string: new Date().toISOString(),
        paid_at: new Date(),
      };

      const paymentResult = await paymentsCollection.insertOne(paymentDoc);

      res.status(201).send({
        message: "Payment recorded and parcel marked as paid",
        insertedId: paymentResult.insertedId,
      });
    } catch (error) {
      console.error("Payment processing failed:", error);
      res.status(500).send({ message: "Failed to record payment" });
    }
  };

  const getPaymentHistory = async (req, res) => {
    try {
      const userEmail = req.query.email;

      if (req.decoded.email !== userEmail) {
        return res.status(403).send({ message: "Forbidden Access" });
      }

      const query = userEmail ? { email: userEmail } : {};
      const options = { sort: { paid_at: -1 } }; // Latest first

      const payments = await paymentsCollection.find(query, options).toArray();
      res.send(payments);
    } catch (error) {
      console.error("Error fetching payment history:", error);
      res.status(500).send({ message: "Failed to get payments" });
    }
  };

  return {
    createPaymentIntent,
    recordPayment,
    getPaymentHistory,
  };
};

module.exports = createPaymentControllers;
