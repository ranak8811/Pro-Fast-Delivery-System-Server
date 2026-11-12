import { Request, Response } from "express";
import { Collection, Document, ObjectId, Filter, Sort } from "mongodb";
import Stripe from "stripe";
import { AuthenticatedRequest } from "../middleware/authMiddleware.js";

export interface PaymentController {
  createPaymentIntent: (req: Request, res: Response) => Promise<void>;
  recordPayment: (req: Request, res: Response) => Promise<void>;
  getPaymentHistory: (
    req: AuthenticatedRequest,
    res: Response,
  ) => Promise<void>;
}

const createPaymentControllers = (
  parcelsCollection: Collection<Document>,
  paymentsCollection: Collection<Document>,
  stripe: Stripe,
): PaymentController => {
  const createPaymentIntent = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    const amountInCents = Number(req.body.amountInCents);
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

  const recordPayment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { parcelId, email, amount, paymentMethod, transactionId } =
        req.body;

      // 1. Update parcel's payment_status
      const updateResult = await parcelsCollection.updateOne(
        { _id: new ObjectId(parcelId as string) },
        {
          $set: {
            payment_status: "paid",
          },
        },
      );

      if (updateResult.modifiedCount === 0) {
        res
          .status(404)
          .send({ message: "Parcel not found or already paid" });
        return;
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

  const getPaymentHistory = async (
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> => {
    try {
      const userEmail = req.query.email as string | undefined;

      if (req.decoded?.email !== userEmail) {
        res.status(403).send({ message: "Forbidden Access" });
        return;
      }

      const query: Filter<Document> = userEmail ? { email: userEmail } : {};
      const sortOption: Sort = { paid_at: -1 }; // Latest first

      const payments = await paymentsCollection
        .find(query)
        .sort(sortOption)
        .toArray();
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

export default createPaymentControllers;
