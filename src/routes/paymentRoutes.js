import express from "express";
import createPaymentControllers from "../controllers/paymentController.js";

const createPaymentRoutes = (
  parcelsCollection,
  paymentsCollection,
  stripe,
  verifyFBToken,
) => {
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
  router.get("/payments", verifyFBToken, paymentController.getPaymentHistory);

  return router;
};

export default createPaymentRoutes;
