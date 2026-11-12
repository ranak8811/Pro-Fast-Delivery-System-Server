import express, { Router } from "express";
import { Collection, Document } from "mongodb";
import createTrackingControllers from "../controllers/trackingController.js";

const createTrackingRoutes = (
  trackingsCollection: Collection<Document>,
  parcelsCollection: Collection<Document>,
  ridersCollection: Collection<Document>,
  paymentsCollection: Collection<Document>,
): Router => {
  const router = express.Router();
  const trackingController = createTrackingControllers(
    trackingsCollection,
    parcelsCollection,
    ridersCollection,
    paymentsCollection,
  );

  router.post("/", trackingController.addTracking);
  router.get(
    "/ai-explain/:trackingId",
    trackingController.getAITrackingExplanation,
  );
  router.get("/:trackingId", trackingController.getTrackings);
  router.post("/", trackingController.createTracking);
  router.get(
    "/details/:trackingId",
    trackingController.getParcelTrackingDetails,
  );

  return router;
};

export default createTrackingRoutes;
