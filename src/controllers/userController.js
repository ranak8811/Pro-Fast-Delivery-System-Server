const { ObjectId } = require("mongodb");

const createUserControllers = (usersCollection) => {
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

  return {
    createUser,
    searchUsers,
    getUserRole,
    updateUserRole,
  };
};

module.exports = createUserControllers;
