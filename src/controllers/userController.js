const { ObjectId } = require("mongodb");

const createUserControllers = (usersCollection, parcelsCollection) => {
  const createUser = async (req, res) => {
    const email = req.body.email;

    const userExists = await usersCollection.findOne({ email });
    if (userExists) {
      // update last login time
      return res.send({ message: "User already exists" });
    }

    const user = req.body;
    const result = await usersCollection.insertOne(user);
    res.send(result);
  };

  const getUserDetails = async (req, res) => {
    const email = req.params.email;

    try {
      const user = await usersCollection.findOne({ email });
      res.send(user);
    } catch (error) {
      console.error("Error getting user details", error);
      res.status(500).send({ message: "Error getting user details" });
    }
  };

  const searchUsers = async (req, res) => {
    const emailQuery = req.query.email;
    if (!emailQuery) {
      return res.status(400).send({ message: "Missing email query" });
    }

    const regex = new RegExp(emailQuery, "i"); // case-insensitive partial match

    try {
      const users = await usersCollection
        .find({ email: { $regex: regex } })
        // .project({ email: 1, createdAt: 1, role: 1 })
        .limit(10)
        .toArray();
      res.send(users);
    } catch (error) {
      console.error("Error searching users", error);
      res.status(500).send({ message: "Error searching users" });
    }
  };

  const getUserRole = async (req, res) => {
    try {
      const email = req.params.email;

      if (!email) {
        return res.status(400).send({ message: "Email is required" });
      }

      const user = await usersCollection.findOne({ email });

      if (!user) {
        return res.status(404).send({ message: "User not found" });
      }

      res.send({ role: user.role || "user" });
    } catch (error) {
      console.error("Error getting user role:", error);
      res.status(500).send({ message: "Failed to get role" });
    }
  };

  const updateUserRole = async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;

    if (!["admin", "user"].includes(role)) {
      return res.status(400).send({ message: "Invalid role" });
    }

    try {
      const result = await usersCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { role } },
      );
      res.send({ message: `User role updated to ${role}`, result });
    } catch (error) {
      console.error("Error updating user role", error);
      res.status(500).send({ message: "Failed to update user role" });
    }
  };

  const getUserDashboardSummary = async (req, res) => {
    try {
      const email = req.query.email;
      if (!email) {
        return res.status(400).send({ message: "User email is required" });
      }

      const userParcels = await parcelsCollection
        .find({ created_by: email })
        .toArray();

      const totalParcels = userParcels.length;

      const parcelStatusCounts = userParcels.reduce((acc, parcel) => {
        acc[parcel.delivery_status] = (acc[parcel.delivery_status] || 0) + 1;
        return acc;
      }, {});

      const recentParcels = userParcels
        .sort((a, b) => new Date(b.creation_date) - new Date(a.creation_date))
        .slice(0, 5)
        .map((parcel) => ({
          _id: parcel._id,
          status: parcel.delivery_status,
          origin: parcel.sender_address,
          destination: parcel.receiver_address,
          creation_date: parcel.creation_date,
        }));

      // Calculate spending history (example: group by month)
      const spendingHistory = userParcels.reduce((acc, parcel) => {
        const month = new Date(parcel.creation_date).toLocaleString("en-US", {
          month: "short",
          year: "numeric",
        });
        acc[month] = (acc[month] || 0) + (parcel.cost || 0); // Assuming 'cost' field exists
        return acc;
      }, {});

      const formattedSpendingHistory = Object.keys(spendingHistory).map(
        (month) => ({
          month,
          amount: spendingHistory[month],
        }),
      );

      res.send({
        totalParcels,
        parcelStatusCounts,
        recentParcels,
        spendingHistory: formattedSpendingHistory,
      });
    } catch (error) {
      console.error("Error getting user dashboard summary:", error);
      res.status(500).send({ message: "Failed to get user dashboard summary" });
    }
  };

  const getUserParcels = async (req, res) => {
    try {
      const email = req.query.email;
      if (!email) {
        return res.status(400).send({ message: "User email is required" });
      }

      const userParcels = await parcelsCollection
        .find({ created_by: email })
        .sort({ creation_date: -1 }) // Sort by newest first
        .toArray();

      res.send(userParcels);
    } catch (error) {
      console.error("Error getting user parcels:", error);
      res.status(500).send({ message: "Failed to get user parcels" });
    }
  };

  return {
    createUser,
    getUserDetails,
    searchUsers,
    getUserRole,
    updateUserRole,
    getUserDashboardSummary,
    getUserParcels,
  };
};

module.exports = createUserControllers;
