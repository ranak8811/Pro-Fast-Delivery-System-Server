import { Request, Response } from "express";
import { Collection, Document, ObjectId, Filter, Sort } from "mongodb";
import { parsePagination } from "../utils/pagination.js";

export interface EmployeeController {
  createRider: (req: Request, res: Response) => Promise<void>;
  getPendingRiders: (req: Request, res: Response) => Promise<void>;
  getActiveRiders: (req: Request, res: Response) => Promise<void>;
  getAvailableRiders: (req: Request, res: Response) => Promise<void>;
  updateRiderStatus: (req: Request, res: Response) => Promise<void>;
  getRiderParcels: (req: Request, res: Response) => Promise<void>;
  getRiderDashboardSummary: (req: Request, res: Response) => Promise<void>;
}

const createEmployeeControllers = (
  ridersCollection: Collection<Document>,
  usersCollection: Collection<Document>,
  parcelsCollection: Collection<Document>,
): EmployeeController => {
  const createRider = async (req: Request, res: Response): Promise<void> => {
    const rider = req.body;
    const result = await ridersCollection.insertOne(rider);
    res.send(result);
  };

  const getPendingRiders = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { page, limit } = req.query;
      const query: Filter<Document> = { status: "pending" };
      const pagination = parsePagination(page, limit);

      if (pagination.isPaginated) {
        const total = await ridersCollection.countDocuments(query);
        const pendingRiders = await ridersCollection
          .find(query)
          .skip(pagination.skip)
          .limit(pagination.limit)
          .toArray();

        res.send({
          data: pendingRiders,
          total,
          page: pagination.page,
          limit: pagination.limit,
          totalPages: Math.ceil(total / pagination.limit),
        });
        return;
      }

      const pendingRiders = await ridersCollection
        .find(query)
        .toArray();

      res.send(pendingRiders);
    } catch (error) {
      console.error("Failed to load pending riders:", error);
      res.status(500).send({ message: "Failed to load pending riders" });
    }
  };

  const getActiveRiders = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { page, limit, search } = req.query as {
        page?: string;
        limit?: string;
        search?: string;
      };

      const query: Filter<Document> = { status: "active" };
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } },
        ];
      }

      const pagination = parsePagination(page, limit);

      if (pagination.isPaginated) {
        const total = await ridersCollection.countDocuments(query);
        const activeRiders = await ridersCollection
          .find(query)
          .skip(pagination.skip)
          .limit(pagination.limit)
          .toArray();

        res.send({
          data: activeRiders,
          total,
          page: pagination.page,
          limit: pagination.limit,
          totalPages: Math.ceil(total / pagination.limit),
        });
        return;
      }

      const result = await ridersCollection.find(query).toArray();
      res.send(result);
    } catch (error) {
      console.error("Failed to load active riders:", error);
      res.status(500).send({ message: "Failed to load active riders" });
    }
  };

  const getAvailableRiders = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    const { district } = req.query;

    try {
      const query: Filter<Document> = {};
      if (district) {
        query.district = district;
      }

      const riders = await ridersCollection.find(query).toArray();
      res.send(riders);
    } catch (err) {
      res.status(500).send({ message: "Failed to load riders" });
    }
  };

  const updateRiderStatus = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    const id = req.params.id as string;
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
      if (status === "active" && email) {
        const userQuery = { email };
        const userUpdatedDoc = {
          $set: {
            role: "rider",
          },
        };

        await usersCollection.updateOne(userQuery, userUpdatedDoc);
      }

      res.send(result);
    } catch (err) {
      res.status(500).send({ message: "Failed to update rider status" });
    }
  };

  const getRiderParcels = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { email, page, limit } = req.query as {
        email?: string;
        page?: string;
        limit?: string;
      };

      if (!email) {
        res.status(400).send({ message: "Rider email is required" });
        return;
      }

      const query: Filter<Document> = {
        assigned_rider_email: email,
        delivery_status: { $in: ["rider_assigned", "in_transit"] },
      };

      const sortOption: Sort = { creation_date: -1 };
      const pagination = parsePagination(page, limit);

      if (pagination.isPaginated) {
        const total = await parcelsCollection.countDocuments(query);
        const parcels = await parcelsCollection
          .find(query)
          .sort(sortOption)
          .skip(pagination.skip)
          .limit(pagination.limit)
          .toArray();

        res.send({
          data: parcels,
          total,
          page: pagination.page,
          limit: pagination.limit,
          totalPages: Math.ceil(total / pagination.limit),
        });
        return;
      }

      const parcels = await parcelsCollection
        .find(query)
        .sort(sortOption)
        .toArray();
      res.send(parcels);
    } catch (error) {
      console.error("Error fetching rider tasks:", error);
      res.status(500).send({ message: "Failed to get rider tasks" });
    }
  };

  const getRiderDashboardSummary = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const email = req.query.email as string | undefined;
      if (!email) {
        res.status(400).send({ message: "Rider email is required" });
        return;
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
      const monthlyEarnings: Record<string, number> = {}; // { 'Jan 2026': 100, 'Feb 2026': 150 }

      riderParcels.forEach((parcel) => {
        if (parcel.delivery_status === "delivered" && parcel.rider_earning) {
          totalEarnings += Number(parcel.rider_earning) || 0;
          const month = new Date(
            parcel.delivered_at || parcel.creation_date,
          ).toLocaleString("en-US", {
            month: "short",
            year: "numeric",
          });
          monthlyEarnings[month] =
            (monthlyEarnings[month] || 0) + (Number(parcel.rider_earning) || 0);
        }
      });

      const formattedMonthlyEarnings = Object.keys(monthlyEarnings).map(
        (month) => ({
          month,
          amount: monthlyEarnings[month],
        }),
      );

      const recentDeliveries = riderParcels
        .sort(
          (a, b) =>
            new Date(b.creation_date).getTime() -
            new Date(a.creation_date).getTime(),
        )
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
