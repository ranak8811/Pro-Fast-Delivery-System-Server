const { ObjectId } = require("mongodb");

const createEmployeeControllers = (ridersCollection, usersCollection, parcelsCollection) => {
  const createRider = async (req, res) => {
    const rider = req.body;
    const result = await ridersCollection.insertOne(rider);
    res.send(result);
  };

  const getPendingRiders = async (req, res) => {
    try {
      const pendingRiders = await ridersCollection
        .find({ status: "pending" })
        .toArray();

      res.send(pendingRiders);
    } catch (error) {
      console.error("Failed to load pending riders:", error);
      res.status(500).send({ message: "Failed to load pending riders" });
    }
  };

  const getActiveRiders = async (req, res) => {
    const result = await ridersCollection
      .find({ status: "active" })
      .toArray();
    res.send(result);
  };

  const getAvailableRiders = async (req, res) => {
    const { district } = req.query;

    try {
      const riders = await ridersCollection
        .find({
          district,
          // status: { $in: ["approved", "active"] },
          // work_status: "available",
        })
        .toArray();

      res.send(riders);
    } catch (err) {
      res.status(500).send({ message: "Failed to load riders" });
    }
  };

  const updateRiderStatus = async (req, res) => {
    const { id } = req.params;
    const { status, email } = req.body;
    const query = { _id: new ObjectId(id) };
    const updateDoc = {
      $set: {
        status,
      },
    };

    try {
      const result = await ridersCollection.updateOne(query, updateDoc);

      // updating user role for accepting rider
      if (status === "active") {
        const userQuery = { email };
        const userUpdatedDoc = {
          $set: {
            role: "rider",
          },
        };

        const roleResult = await usersCollection.updateOne(
          userQuery,
          userUpdatedDoc,
        );
        console.log("role update for rider: ", roleResult.modifiedCount);
      }

      res.send(result);
    } catch (err) {
      res.status(500).send({ message: "Failed to update rider status" });
    }
  };

  const getRiderParcels = async (req, res) => {
    try {
      const email = req.query.email;

      if (!email) {
        return res.status(400).send({ message: "Rider email is required" });
      }

      const query = {
        assigned_rider_email: email,
        delivery_status: { $in: ["rider_assigned", "in_transit"] },
      };

      const options = {
        sort: { creation_date: -1 }, // Newest first
      };

      const parcels = await parcelsCollection.find(query, options).toArray();
      res.send(parcels);
    } catch (error) {
      console.error("Error fetching rider tasks:", error);
      res.status(500).send({ message: "Failed to get rider tasks" });
    }
  };

  return {
    createRider,
    getPendingRiders,
    getActiveRiders,
    getAvailableRiders,
    updateRiderStatus,
    getRiderParcels,
  };
};

module.exports = createEmployeeControllers;
