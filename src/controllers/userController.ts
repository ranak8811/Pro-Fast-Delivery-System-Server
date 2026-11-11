import { Request, Response } from "express";
import { Collection, ObjectId } from "mongodb";

export interface UserController {
  createUser: (req: Request, res: Response) => Promise<any>;
  getUserDetails: (req: Request, res: Response) => Promise<any>;
  searchUsers: (req: Request, res: Response) => Promise<any>;
  getUserRole: (req: Request, res: Response) => Promise<any>;
  updateUserRole: (req: Request, res: Response) => Promise<any>;
  getUserDashboardSummary: (req: Request, res: Response) => Promise<any>;
  getUserParcels: (req: Request, res: Response) => Promise<any>;
}

const createUserControllers = (
  usersCollection: Collection<any>,
  parcelsCollection: Collection<any>
): UserController => {
  const createUser = async (req: Request, res: Response): Promise<any> => {
    const email = req.body.email;

    const userExists = await usersCollection.findOne({ email });
    if (userExists) {
      return res.send({ message: "User already exists" });
    }

    const user = req.body;
    const result = await usersCollection.insertOne(user);
    res.send(result);
  };

  const getUserDetails = async (req: Request, res: Response): Promise<any> => {
    const email = req.params.email;

    try {
      const user = await usersCollection.findOne({ email });
      res.send(user);
    } catch (error) {
      console.error("Error getting user details", error);
      res.status(500).send({ message: "Error getting user details" });
    }
  };

  const searchUsers = async (req: Request, res: Response): Promise<any> => {
    const emailQuery = req.query.email as string | undefined;
    if (!emailQuery) {
      return res.status(400).send({ message: "Missing email query" });
    }

    const regex = new RegExp(emailQuery, "i"); // case-insensitive partial match

    try {
      const users = await usersCollection
        .find({ email: { $regex: regex } })
        .limit(10)
        .toArray();
      res.send(users);
    } catch (error) {
      console.error("Error searching users", error);
      res.status(500).send({ message: "Error searching users" });
    }
  };

  const getUserRole = async (req: Request, res: Response): Promise<any> => {
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

  const updateUserRole = async (req: Request, res: Response): Promise<any> => {
    const id = req.params.id as string;
    const { role } = req.body;

    if (!["admin", "user", "rider"].includes(role)) {
      return res.status(400).send({ message: "Invalid role" });
    }

    try {
      const result = await usersCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { role } }
      );
      res.send({ message: `User role updated to ${role}`, result });
    } catch (error) {
      console.error("Error updating user role", error);
      res.status(500).send({ message: "Failed to update user role" });
    }
  };

  const getUserDashboardSummary = async (req: Request, res: Response): Promise<any> => {
    try {
      const email = req.query.email as string | undefined;
      if (!email) {
        return res.status(400).send({ message: "User email is required" });
      }

      const userParcels = await parcelsCollection
        .find({ created_by: email })
        .toArray();

      const totalParcels = userParcels.length;

      const parcelStatusCounts = userParcels.reduce((acc: Record<string, number>, parcel: any) => {
        acc[parcel.delivery_status] = (acc[parcel.delivery_status] || 0) + 1;
        return acc;
      }, {});

      const recentParcels = userParcels
        .sort((a: any, b: any) => new Date(b.creation_date).getTime() - new Date(a.creation_date).getTime())
        .slice(0, 5)
        .map((parcel: any) => ({
          _id: parcel._id,
          status: parcel.delivery_status,
          origin: parcel.sender_address,
          destination: parcel.receiver_address,
          creation_date: parcel.creation_date,
        }));

      // Calculate spending history (group by month)
      const spendingHistory = userParcels.reduce((acc: Record<string, number>, parcel: any) => {
        const month = new Date(parcel.creation_date).toLocaleString("en-US", {
          month: "short",
          year: "numeric",
        });
        acc[month] = (acc[month] || 0) + (parcel.cost || 0);
        return acc;
      }, {});

      const formattedSpendingHistory = Object.keys(spendingHistory).map((month) => ({
        month,
        amount: spendingHistory[month],
      }));

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

  const getUserParcels = async (req: Request, res: Response): Promise<any> => {
    try {
      const email = req.query.email as string | undefined;
      if (!email) {
        return res.status(400).send({ message: "User email is required" });
      }

      const userParcels = await parcelsCollection
        .find({ created_by: email })
        .sort({ creation_date: -1 })
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

export default createUserControllers;
