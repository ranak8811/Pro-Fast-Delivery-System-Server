import { Request, Response } from "express";
import { Collection, Document, ObjectId, Sort } from "mongodb";
import { explainTrackingStatus } from "../services/aiService.js";
import type { Parcel } from "../types/parcel.js";
import type { TrackingEntry } from "../types/tracking.js";
import { aiCache } from "../utils/cache.js";

export interface TrackingController {
  addTracking: (req: Request, res: Response) => Promise<void>;
  getTrackings: (req: Request, res: Response) => Promise<void>;
  createTracking: (req: Request, res: Response) => Promise<void>;
  getParcelTrackingDetails: (req: Request, res: Response) => Promise<void>;
  getAITrackingExplanation: (req: Request, res: Response) => Promise<void>;
}

const createTrackingControllers = (
  trackingsCollection: Collection<Document>,
  parcelsCollection: Collection<Document>,
  ridersCollection: Collection<Document>,
  paymentsCollection: Collection<Document>,
): TrackingController => {
  const addTracking = async (req: Request, res: Response): Promise<void> => {
    const {
      tracking_id,
      parcel_id,
      status,
      message,
      updated_by = "",
    } = req.body;

    const log: Record<string, unknown> = {
      tracking_id,
      status,
      message,
      time: new Date(),
      updated_by,
    };

    if (parcel_id) {
      log.parcel_id = new ObjectId(parcel_id as string);
    }

    const result = await trackingsCollection.insertOne(log);
    res.send({ success: true, insertedId: result.insertedId });
  };

  const getTrackings = async (req: Request, res: Response): Promise<void> => {
    const trackingId = req.params.trackingId as string;

    const updates = await trackingsCollection
      .find({ tracking_id: trackingId })
      .sort({ timestamp: 1 })
      .toArray();

    res.json(updates);
  };

  const createTracking = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    const update = req.body;

    update.timestamp = new Date();
    if (!update.tracking_id || !update.status) {
      res
        .status(400)
        .json({ message: "tracking_id and status are required." });
      return;
    }

    const result = await trackingsCollection.insertOne(update);
    res.status(201).json(result);
  };

  const getParcelTrackingDetails = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    const { trackingId } = req.params;

    try {
      // 1. Fetch Parcel Details
      const parcel = await parcelsCollection.findOne({
        tracking_id: trackingId,
      });

      if (!parcel) {
        res.status(404).send({ message: "Parcel not found" });
        return;
      }

      // 2. Fetch Tracking Events
      const sortOption: Sort = { time: 1 };
      const trackingEvents = await trackingsCollection
        .find({ tracking_id: trackingId })
        .sort(sortOption)
        .toArray();

      // 3. Fetch Rider Details (if assigned)
      let riderDetails = null;
      if (parcel.assigned_rider_email) {
        riderDetails = await ridersCollection.findOne(
          { email: parcel.assigned_rider_email },
          {
            projection: {
              name: 1,
              email: 1,
              phone: 1,
              bike_brand: 1,
              status: 1,
            },
          },
        );
      }

      // 4. Fetch Payment Details
      let paymentDetails = null;
      if (parcel._id) {
        paymentDetails = await paymentsCollection.findOne(
          { parcelId: parcel._id.toString() },
          {
            projection: {
              amount: 1,
              paymentMethod: 1,
              transactionId: 1,
              paid_at: 1,
            },
          },
        );
      }

      res.send({
        parcel,
        trackingEvents,
        riderDetails,
        paymentDetails,
      });
    } catch (error) {
      console.error("Error fetching parcel tracking details:", error);
      res
        .status(500)
        .send({ message: "Failed to get parcel tracking details" });
    }
  };

  const getAITrackingExplanation = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const trackingId = req.params.trackingId;

      if (!trackingId) {
        res.status(400).json({ message: "Tracking ID is required" });
        return;
      }

      // 1. Fetch parcel
      const parcelDoc = await parcelsCollection.findOne({
        tracking_id: trackingId,
      });
      if (!parcelDoc) {
        res.status(404).json({ message: "Parcel not found" });
        return;
      }

      const parcel = parcelDoc as unknown as Parcel;

      // Check In-Memory Cache (Key: trackingId + delivery_status + payment_status)
      const cacheKey = `ai_explain_${trackingId}_${parcel.delivery_status}_${parcel.payment_status}`;
      const cached = aiCache.get(cacheKey);
      if (cached) {
        res.json({
          ...cached,
          from_cache: true,
        });
        return;
      }

      // 2. Fetch tracking logs
      const sortOption: Sort = { timestamp: -1 };
      const trackingLogs = (await trackingsCollection
        .find({ tracking_id: trackingId })
        .sort(sortOption)
        .toArray()) as unknown as TrackingEntry[];

      const latestTracking =
        trackingLogs.length > 0 ? trackingLogs[0] : null;

      // 3. Generate AI summary
      const aiResponse = await explainTrackingStatus(parcel, latestTracking);

      // Save to cache (5 minutes TTL = 300,000ms)
      aiCache.set(cacheKey, aiResponse, 300000);

      res.json({
        ...aiResponse,
        from_cache: false,
      });
    } catch (error) {
      console.error("Error generating AI tracking explanation:", error);
      res
        .status(500)
        .json({ message: "Failed to generate AI tracking explanation" });
    }
  };

  return {
    addTracking,
    getTrackings,
    createTracking,
    getParcelTrackingDetails,
    getAITrackingExplanation,
  };
};

export default createTrackingControllers;
