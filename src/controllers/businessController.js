import { ObjectId } from "mongodb";

const createParcelControllers = (parcelsCollection, ridersCollection) => {
  const getParcels = async (req, res) => {
    try {
      const { email, payment_status, delivery_status } = req.query;
      let query = {};
      if (email) {
        query = { created_by: email };
      }

      if (payment_status) {
        query.payment_status = payment_status;
      }

      if (delivery_status) {
        query.delivery_status = delivery_status;
      }

      const options = {
        sort: { createdAt: -1 }, // Newest first
      };

      const parcels = await parcelsCollection.find(query, options).toArray();
      res.send(parcels);
    } catch (error) {
      console.error("Error fetching parcels:", error);
      res.status(500).send({ message: "Failed to get parcels" });
    }
  };

  const getCompletedParcelsForRider = async (req, res) => {
    try {
      const email = req.query.email;

      if (!email) {
        return res.status(400).send({ message: "Rider email is required" });
      }

      const query = {
        assigned_rider_email: email,
        delivery_status: {
          $in: ["delivered", "service_center_delivered"],
        },
      };

      const options = {
        sort: { creation_date: -1 }, // Latest first
      };

      const completedParcels = await parcelsCollection
        .find(query, options)
        .toArray();

      res.send(completedParcels);
    } catch (error) {
      console.error("Error loading completed parcels:", error);
      res.status(500).send({ message: "Failed to load completed deliveries" });
    }
  };

  const cashoutParcel = async (req, res) => {
    const id = req.params.id;
    const result = await parcelsCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          cashout_status: "cashed_out",
          cashed_out_at: new Date(),
        },
      },
    );
    res.send(result);
  };

  const createParcel = async (req, res) => {
    try {
      const newParcel = req.body;
      const result = await parcelsCollection.insertOne(newParcel);
      res.send(result);
    } catch (error) {
      console.error("Error inserting parcel data:", error);
      res.status(500).json({ message: "Failed to insert parcel data" });
    }
  };

  const assignRider = async (req, res) => {
    const parcelId = req.params.id;
    const { riderId, riderName, riderEmail } = req.body;

    try {
      // Update parcel
      await parcelsCollection.updateOne(
        { _id: new ObjectId(parcelId) },
        {
          $set: {
            delivery_status: "rider_assigned",
            assigned_rider_id: riderId,
            assigned_rider_email: riderEmail,
            assigned_rider_name: riderName,
          },
        },
      );

      // Update rider
      await ridersCollection.updateOne(
        { _id: new ObjectId(riderId) },
        {
          $set: {
            work_status: "in_delivery",
          },
        },
      );

      res.send({ message: "Rider assigned" });
    } catch (err) {
      console.error(err);
      res.status(500).send({ message: "Failed to assign rider" });
    }
  };

  const deleteParcel = async (req, res) => {
    try {
      const id = req.params.id;

      const result = await parcelsCollection.deleteOne({
        _id: new ObjectId(id),
      });

      res.send(result);
    } catch (error) {
      console.error("Error deleting parcel:", error);
      res.status(500).send({ message: "Failed to delete parcel" });
    }
  };

  const getParcelById = async (req, res) => {
    try {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await parcelsCollection.findOne(query);
      res.send(result);
    } catch (error) {
      console.error("Error fetching parcel data:", error);
      res.status(500).json({ message: "Failed to fetch parcel data" });
    }
  };

  const getParcelStatusCount = async (req, res) => {
    const pipeline = [
      {
        $group: {
          _id: "$delivery_status",
          count: {
            $sum: 1,
          },
        },
      },
      {
        $project: {
          status: "$_id",
          count: 1,
          _id: 0,
        },
      },
    ];

    const result = await parcelsCollection.aggregate(pipeline).toArray();
    res.send(result);
  };

  const updateParcelStatus = async (req, res) => {
    const parcelId = req.params.id;
    const { status } = req.body;
    const updatedDoc = {
      delivery_status: status,
    };

    if (status === "in_transit") {
      updatedDoc.picked_at = new Date().toISOString();
    } else if (status === "delivered") {
      updatedDoc.delivered_at = new Date().toISOString();
    }

    try {
      const result = await parcelsCollection.updateOne(
        { _id: new ObjectId(parcelId) },
        {
          $set: updatedDoc,
        },
      );
      res.send(result);
    } catch (error) {
      res.status(500).send({ message: "Failed to update status" });
    }
  };

  return {
    getParcels,
    getCompletedParcelsForRider,
    cashoutParcel,
    createParcel,
    assignRider,
    deleteParcel,
    getParcelById,
    getParcelStatusCount,
    updateParcelStatus,
  };
};

export default createParcelControllers;
