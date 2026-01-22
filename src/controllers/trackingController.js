const { ObjectId } = require("mongodb");

const createTrackingControllers = (trackingsCollection) => {
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

  return {
    addTracking,
    getTrackings,
    createTracking,
  };
};

module.exports = createTrackingControllers;
