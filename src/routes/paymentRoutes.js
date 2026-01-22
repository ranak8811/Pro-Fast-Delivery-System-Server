const express = require("express");
const createPaymentControllers = require("../controllers/paymentController");

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

module.exports = createPaymentRoutes;
