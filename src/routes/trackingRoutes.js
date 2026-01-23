const express = require("express");
const createTrackingControllers = require("../controllers/trackingController");

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
  router.post("/", trackingController.createTracking); // Note: This is a duplicate route for POST /
  // The original index.js has two POST /tracking routes with slightly different logic.
  // I'm keeping both for now as per "write exam code as it is but in modular way".
  // Suggestion: These two POST routes for tracking should be merged into one.
  router.get("/details/:trackingId", trackingController.getParcelTrackingDetails);

  return router;
};

module.exports = createTrackingRoutes;
