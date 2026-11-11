import { ObjectId } from "mongodb";
import { DeliveryStatus } from "./parcel.js";

export interface TrackingEntry {
  _id?: ObjectId | string;
  tracking_id: string;
  parcel_id?: string;
  status: DeliveryStatus | string;
  message: string;
  note?: string;
  location?: string;
  updated_by?: string;
  timestamp: string;
}
