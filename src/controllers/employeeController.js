import { ObjectId } from "mongodb";

const createEmployeeControllers = (
  ridersCollection,
  usersCollection,
  parcelsCollection,
) => {
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
    const result = await ridersCollection.find({ status: "active" }).toArray();
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

  const getRiderDashboardSummary = async (req, res) => {
    try {
      const email = req.query.email;
      if (!email) {
        return res.status(400).send({ message: "Rider email is required" });
      }

      const riderParcels = await parcelsCollection
        .find({ assigned_rider_email: email })
        .toArray();

      const totalDeliveriesCompleted = riderParcels.filter(
        (parcel) => parcel.delivery_status === "delivered",
      ).length;
      const totalDeliveriesPending = riderParcels.filter(
        (parcel) =>
          parcel.delivery_status === "rider_assigned" ||
          parcel.delivery_status === "in_transit",
      ).length;

      // Calculate average delivery time
      const deliveredParcelsWithTimes = riderParcels.filter(
        (parcel) =>
          parcel.delivery_status === "delivered" &&
          parcel.picked_at &&
          parcel.delivered_at,
      );

      let averageDeliveryTime = "N/A";
      if (deliveredParcelsWithTimes.length > 0) {
        const totalDeliveryDurationMs = deliveredParcelsWithTimes.reduce(
          (sum, parcel) => {
            const pickedAt = new Date(parcel.picked_at).getTime();
            const deliveredAt = new Date(parcel.delivered_at).getTime();
            return sum + (deliveredAt - pickedAt);
          },
          0,
        );

        const avgDurationMs =
          totalDeliveryDurationMs / deliveredParcelsWithTimes.length;
        const avgDurationMinutes = Math.round(avgDurationMs / (1000 * 60));
        const hours = Math.floor(avgDurationMinutes / 60);
        const minutes = avgDurationMinutes % 60;
        averageDeliveryTime = `${hours > 0 ? `${hours}h ` : ""}${minutes}m`;
      }

      // Calculate total earnings and monthly earnings
      let totalEarnings = 0;
      const monthlyEarnings = {}; // { 'Jan 2026': 100, 'Feb 2026': 150 }

      riderParcels.forEach((parcel) => {
        if (parcel.delivery_status === "delivered" && parcel.rider_earning) {
          totalEarnings += parcel.rider_earning;
          const month = new Date(
            parcel.delivered_at || parcel.creation_date,
          ).toLocaleString("en-US", {
            month: "short",
            year: "numeric",
          });
          monthlyEarnings[month] =
            (monthlyEarnings[month] || 0) + parcel.rider_earning;
        }
      });

      const formattedMonthlyEarnings = Object.keys(monthlyEarnings).map(
        (month) => ({
          month,
          amount: monthlyEarnings[month],
        }),
      );

      const recentDeliveries = riderParcels
        .sort((a, b) => new Date(b.creation_date) - new Date(a.creation_date))
        .slice(0, 5)
        .map((parcel) => ({
          _id: parcel._id,
          status: parcel.delivery_status,
          origin: parcel.sender_address,
          destination: parcel.receiver_address,
          creation_date: parcel.creation_date,
        }));

      res.send({
        totalDeliveriesCompleted,
        totalDeliveriesPending,
        averageDeliveryTime,
        totalEarnings,
        monthlyEarnings: formattedMonthlyEarnings,
        recentDeliveries,
      });
    } catch (error) {
      console.error("Error getting rider dashboard summary:", error);
      res
        .status(500)
        .send({ message: "Failed to get rider dashboard summary" });
    }
  };

  return {
    createRider,
    getPendingRiders,
    getActiveRiders,
    getAvailableRiders,
    updateRiderStatus,
    getRiderParcels,
    getRiderDashboardSummary,
  };
};

export default createEmployeeControllers;
