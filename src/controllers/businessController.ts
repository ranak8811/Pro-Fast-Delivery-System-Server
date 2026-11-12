import { Request, Response } from "express";
import { Collection, ObjectId, Sort } from "mongodb";

export interface BusinessController {
  getParcels: (req: Request, res: Response) => Promise<any>;
  getCompletedParcelsForRider: (req: Request, res: Response) => Promise<any>;
  cashoutParcel: (req: Request, res: Response) => Promise<any>;
  createParcel: (req: Request, res: Response) => Promise<any>;
  assignRider: (req: Request, res: Response) => Promise<any>;
  deleteParcel: (req: Request, res: Response) => Promise<any>;
  getParcelById: (req: Request, res: Response) => Promise<any>;
  getParcelStatusCount: (req: Request, res: Response) => Promise<any>;
  updateParcelStatus: (req: Request, res: Response) => Promise<any>;
}

const createParcelControllers = (
  parcelsCollection: Collection<any>,
  ridersCollection: Collection<any>
): BusinessController => {
  const getParcels = async (req: Request, res: Response): Promise<any> => {
    try {
      const { email, payment_status, delivery_status } = req.query as {
        email?: string;
        payment_status?: string;
        delivery_status?: string;
      };
      let query: any = {};
      if (email) {
        query.created_by = email;
      }

      if (payment_status) {
        query.payment_status = payment_status;
      }

      if (delivery_status) {
        query.delivery_status = delivery_status;
      }

      const sort: Sort = { createdAt: -1 };

      const parcels = await parcelsCollection.find(query).sort(sort).toArray();
      res.send(parcels);
    } catch (error) {
      console.error("Error fetching parcels:", error);
      res.status(500).send({ message: "Failed to get parcels" });
    }
  };

  const getCompletedParcelsForRider = async (req: Request, res: Response): Promise<any> => {
    try {
      const email = req.query.email as string | undefined;

      if (!email) {
        return res.status(400).send({ message: "Rider email is required" });
      }

      const query = {
        assigned_rider_email: email,
        delivery_status: {
          $in: ["delivered", "service_center_delivered"],
        },
      };

      const sort: Sort = { creation_date: -1 };

      const completedParcels = await parcelsCollection
        .find(query)
        .sort(sort)
        .toArray();

      res.send(completedParcels);
    } catch (error) {
      console.error("Error loading completed parcels:", error);
      res.status(500).send({ message: "Failed to load completed deliveries" });
    }
  };

  const cashoutParcel = async (req: Request, res: Response): Promise<any> => {
    const id = req.params.id as string;
    const result = await parcelsCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          cashout_status: "cashed_out",
          cashed_out_at: new Date(),
        },
      }
    );
    res.send(result);
  };

  const createParcel = async (req: Request, res: Response): Promise<any> => {
    try {
      const newParcel = req.body;
      const result = await parcelsCollection.insertOne(newParcel);
      res.send(result);
    } catch (error) {
      console.error("Error inserting parcel data:", error);
      res.status(500).json({ message: "Failed to insert parcel data" });
    }
  };

  const assignRider = async (req: Request, res: Response): Promise<any> => {
    const parcelId = req.params.id as string;
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
        }
      );

      // Update rider
      await ridersCollection.updateOne(
        { _id: new ObjectId(riderId) },
        {
          $set: {
            work_status: "in_delivery",
          },
        }
      );

      res.send({ message: "Rider assigned" });
    } catch (err) {
      console.error(err);
      res.status(500).send({ message: "Failed to assign rider" });
    }
  };

  const deleteParcel = async (req: Request, res: Response): Promise<any> => {
    try {
      const id = req.params.id as string;

      const result = await parcelsCollection.deleteOne({
        _id: new ObjectId(id),
      });

      res.send(result);
    } catch (error) {
      console.error("Error deleting parcel:", error);
      res.status(500).send({ message: "Failed to delete parcel" });
    }
  };

  const getParcelById = async (req: Request, res: Response): Promise<any> => {
    try {
      const id = req.params.id as string;
      const query = { _id: new ObjectId(id) };
      const result = await parcelsCollection.findOne(query);
      res.send(result);
    } catch (error) {
      console.error("Error fetching parcel data:", error);
      res.status(500).json({ message: "Failed to fetch parcel data" });
    }
  };

  const getParcelStatusCount = async (req: Request, res: Response): Promise<any> => {
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

  const updateParcelStatus = async (req: Request, res: Response): Promise<any> => {
    const parcelId = req.params.id as string;
    const { status } = req.body;
    const updatedDoc: any = {
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
        }
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
