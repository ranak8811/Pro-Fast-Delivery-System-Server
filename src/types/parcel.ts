import { ObjectId } from "mongodb";

export type DeliveryStatus =
  | "not_collected"
  | "rider_assigned"
  | "in_transit"
  | "service_center_delivered"
  | "delivered"
  | "cancelled";

export type PaymentStatus = "paid" | "unpaid";

export interface Parcel {
  _id?: ObjectId | string;
  tracking_id: string;
  title: string;
  type: string;
  weight: number;
  cost: number;
  sender_name: string;
  sender_contact: string;
  sender_address: string;
  sender_district?: string;
  receiver_name: string;
  receiver_contact: string;
  receiver_address: string;
  receiver_district?: string;
  created_by: string; // User email
  assigned_rider_email?: string;
  assigned_rider_name?: string;
  delivery_status: DeliveryStatus;
  payment_status: PaymentStatus;
  creation_date: string;
  updated_at?: string;
}
