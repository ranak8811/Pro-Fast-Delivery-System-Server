import express from "express";
import createTrackingControllers from "../controllers/trackingController.js";

const createTrackingRoutes = (
  trackingsCollection,
  parcelsCollection,
  ridersCollection,
  paymentsCollection,
) => {
  const router = express.Router();
  const trackingController = createTrackingControllers(
    trackingsCollection,
    parcelsCollection,
    ridersCollection,
    paymentsCollection,
  );

  router.post("/", trackingController.addTracking);
  router.get("/:trackingId", trackingController.getTrackings);
  router.post("/", trackingController.createTracking);
  router.get("/details/:trackingId", trackingController.getParcelTrackingDetails);

  return router;
};

export default createTrackingRoutes;
