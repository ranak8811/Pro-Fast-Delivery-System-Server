import express, { Router, Request, Response, NextFunction } from "express";
import { Collection, Document } from "mongodb";
import createParcelControllers from "../controllers/businessController.js";

export type MiddlewareFunction = (
  req: Request,
  res: Response,
  next: NextFunction,
) => void | Promise<void>;

const createBusinessRoutes = (
  parcelsCollection: Collection<Document>,
  ridersCollection: Collection<Document>,
  verifyFBToken: MiddlewareFunction,
  verifyRider: MiddlewareFunction,
): Router => {
  const router = express.Router();
  const parcelController = createParcelControllers(
    parcelsCollection,
    ridersCollection,
  );

  router.get("/", verifyFBToken, parcelController.getParcels);
  router.get(
    "/rider/completed-parcels",
    verifyFBToken,
    verifyRider,
    parcelController.getCompletedParcelsForRider,
  );
  router.patch("/:id/cashout", parcelController.cashoutParcel);
  router.post("/", parcelController.createParcel);
  router.patch("/:id/assign", parcelController.assignRider);
  router.delete("/:id", parcelController.deleteParcel);
  router.get("/:id", parcelController.getParcelById);
  router.get("/delivery/status-count", parcelController.getParcelStatusCount);
  router.patch("/:id/status", parcelController.updateParcelStatus);

  return router;
};

export default createBusinessRoutes;
