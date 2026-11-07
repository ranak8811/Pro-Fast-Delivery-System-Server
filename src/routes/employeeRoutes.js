import express from "express";
import createEmployeeControllers from "../controllers/employeeController.js";

const createEmployeeRoutes = (
  ridersCollection,
  usersCollection,
  parcelsCollection, // Add parcelsCollection as it's used in getRiderParcels
  verifyFBToken,
  verifyAdmin,
) => {
  const router = express.Router();
  const employeeController = createEmployeeControllers(
    ridersCollection,
    usersCollection,
    parcelsCollection, // Pass parcelsCollection
  );

  router.post("/", employeeController.createRider);
  router.get(
    "/pending",
    verifyFBToken,
    verifyAdmin,
    employeeController.getPendingRiders,
  );
  router.get(
    "/active",
    verifyFBToken,
    verifyAdmin,
    employeeController.getActiveRiders,
  );
  router.get("/available", employeeController.getAvailableRiders); // No middleware for available riders
  router.patch("/:id/status", employeeController.updateRiderStatus);
  router.get("/parcels", verifyFBToken, employeeController.getRiderParcels); // For specific rider's parcels
  router.get(
    "/dashboard-summary",
    verifyFBToken,
    employeeController.getRiderDashboardSummary,
  );

  return router;
};

export default createEmployeeRoutes;
