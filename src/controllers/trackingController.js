import { ObjectId } from "mongodb";
import { explainTrackingStatus } from "../services/aiService.js";
import { aiCache } from "../utils/cache.js";

const createTrackingControllers = (
  trackingsCollection,
  parcelsCollection,
  ridersCollection,
  paymentsCollection,
) => {
  const addTracking = async (req, res) => {
    const {
      tracking_id,
      parcel_id,
      status,
      message,
      updated_by = "",
    } = req.body;

    const log = {
      tracking_id,
      parcel_id: parcel_id ? new ObjectId(parcel_id) : undefined,
      status,
      message,
      time: new Date(),
      updated_by,
    };

    const result = await trackingsCollection.insertOne(log);
    res.send({ success: true, insertedId: result.insertedId });
  };

  const getTrackings = async (req, res) => {
    const trackingId = req.params.trackingId;

    const updates = await trackingsCollection
      .find({ tracking_id: trackingId })
      .sort({ timestamp: 1 }) // sort by time ascending
      .toArray();

    res.json(updates);
  };

  const createTracking = async (req, res) => {
    const update = req.body;

    update.timestamp = new Date(); // ensure correct timestamp
    if (!update.tracking_id || !update.status) {
      return res
        .status(400)
        .json({ message: "tracking_id and status are required." });
    }

    const result = await trackingsCollection.insertOne(update);
    res.status(201).json(result);
  };

  const getParcelTrackingDetails = async (req, res) => {
    const { trackingId } = req.params;

    try {
      // 1. Fetch Parcel Details
      const parcel = await parcelsCollection.findOne({ tracking_id: trackingId });

      if (!parcel) {
        return res.status(404).send({ message: "Parcel not found" });
      }

      // 2. Fetch Tracking Events
      const trackingEvents = await trackingsCollection
        .find({ tracking_id: trackingId })
        .sort({ time: 1 }) // Sort by time ascending
        .toArray();

      // 3. Fetch Rider Details (if assigned)
      let riderDetails = null;
      if (parcel.assigned_rider_email) {
        riderDetails = await ridersCollection.findOne(
          { email: parcel.assigned_rider_email },
          { projection: { name: 1, email: 1, phone: 1, bike_brand: 1, status: 1 } } // Project only necessary fields
        );
      }

      // 4. Fetch Payment Details
      let paymentDetails = null;
      if (parcel._id) {
        paymentDetails = await paymentsCollection.findOne(
          { parcelId: parcel._id.toString() }, // Convert ObjectId to string for matching
          { projection: { amount: 1, paymentMethod: 1, transactionId: 1, paid_at: 1 } } // Project only necessary fields
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
      res.status(500).send({ message: "Failed to get parcel tracking details" });
    }
  };

  const getAITrackingExplanation = async (req, res) => {
    try {
      const trackingId = req.params.trackingId;

      if (!trackingId) {
        return res.status(400).json({ message: "Tracking ID is required" });
      }

      // 1. Fetch parcel
      const parcel = await parcelsCollection.findOne({ tracking_id: trackingId });
      if (!parcel) {
        return res.status(404).json({ message: "Parcel not found" });
      }

      // Check In-Memory Cache (Key: trackingId + delivery_status + payment_status)
      const cacheKey = `ai_explain_${trackingId}_${parcel.delivery_status}_${parcel.payment_status}`;
      const cached = aiCache.get(cacheKey);
      if (cached) {
        return res.json({
          ...cached,
          from_cache: true,
        });
      }

      // 2. Fetch tracking logs
      const trackingLogs = await trackingsCollection
        .find({ tracking_id: trackingId })
        .sort({ timestamp: -1 })
        .toArray();

      // 3. Generate AI summary
      const aiResponse = await explainTrackingStatus(parcel, trackingLogs);

      // Save to cache (5 minutes TTL = 300,000ms)
      aiCache.set(cacheKey, aiResponse, 300000);

      res.json({
        ...aiResponse,
        from_cache: false,
      });
    } catch (error) {
      console.error("Error generating AI tracking explanation:", error);
      res.status(500).json({ message: "Failed to generate AI tracking explanation" });
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
