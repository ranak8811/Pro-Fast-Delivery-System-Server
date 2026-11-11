import express, { Router, Request, Response, NextFunction } from "express";
import { Collection, Document } from "mongodb";
import createUserControllers from "../controllers/userController.js";

export type MiddlewareFunction = (
  req: Request,
  res: Response,
  next: NextFunction,
) => void | Promise<void>;

const createUserRoutes = (
  usersCollection: Collection<Document>,
  parcelsCollection: Collection<Document>,
  verifyFBToken: MiddlewareFunction,
  verifyAdmin: MiddlewareFunction,
): Router => {
  const router = express.Router();
  const userController = createUserControllers(
    usersCollection,
    parcelsCollection,
  );

  router.post("/", userController.createUser);
  router.get("/search", userController.searchUsers);
  router.get(
    "/dashboard-summary-for-user",
    verifyFBToken,
    userController.getUserDashboardSummary,
  );
  router.get(
    "/parcels",
    verifyFBToken,
    userController.getUserParcels,
  );
  router.get("/:email", userController.getUserDetails);
  router.get("/:email/role", userController.getUserRole);
  router.patch(
    "/:id/role",
    verifyFBToken,
    verifyAdmin,
    userController.updateUserRole,
  );

  return router;
};

export default createUserRoutes;
