import express, { Router, Request, Response, NextFunction, RequestHandler } from "express";
import { Collection, Document } from "mongodb";
import Stripe from "stripe";
import createPaymentControllers from "../controllers/paymentController.js";

export type MiddlewareFunction = (
  req: Request,
  res: Response,
  next: NextFunction,
) => void | Promise<void>;

const createPaymentRoutes = (
  parcelsCollection: Collection<Document>,
  paymentsCollection: Collection<Document>,
  stripe: Stripe,
  verifyFBToken: MiddlewareFunction,
): Router => {
  const router = express.Router();
  const paymentController = createPaymentControllers(
    parcelsCollection,
    paymentsCollection,
    stripe,
  );

  router.post(
    "/create-payment-intent",
    paymentController.createPaymentIntent,
  );
  router.post("/payments", paymentController.recordPayment);
  router.get(
    "/payments",
    verifyFBToken as RequestHandler,
    paymentController.getPaymentHistory as unknown as RequestHandler,
  );

  return router;
};

export default createPaymentRoutes;
