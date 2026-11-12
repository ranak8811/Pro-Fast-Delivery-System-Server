import express, { Router, Request, Response, NextFunction } from "express";
import { Collection, Document } from "mongodb";
import createEmployeeControllers from "../controllers/employeeController.js";

export type MiddlewareFunction = (
  req: Request,
  res: Response,
  next: NextFunction,
) => void | Promise<void>;

const createEmployeeRoutes = (
  ridersCollection: Collection<Document>,
  usersCollection: Collection<Document>,
  parcelsCollection: Collection<Document>,
  verifyFBToken: MiddlewareFunction,
  verifyAdmin: MiddlewareFunction,
): Router => {
  const router = express.Router();
  const employeeController = createEmployeeControllers(
    ridersCollection,
    usersCollection,
    parcelsCollection,
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
  router.get("/available", employeeController.getAvailableRiders);
  router.patch("/:id/status", employeeController.updateRiderStatus);
  router.get("/parcels", verifyFBToken, employeeController.getRiderParcels);
  router.get(
    "/dashboard-summary",
    verifyFBToken,
    employeeController.getRiderDashboardSummary,
  );

  return router;
};

export default createEmployeeRoutes;
