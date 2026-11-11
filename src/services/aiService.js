import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import dotenv from "dotenv";

dotenv.config();

const PRIMARY_MODEL = "liquid/lfm-3-1.7b:free";
const FALLBACK_MODEL = "meta-llama/llama-3.2-3b-instruct:free";

const createModelInstance = (modelName) => {
  return new ChatOpenAI({
    apiKey: process.env.OPENROUTER_API_KEY || "",
    modelName: modelName,
    configuration: {
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": "https://pro-fast-delivery.web.app",
        "X-Title": "Pro Fast Delivery System AI Assistant",
      },
    },
    temperature: 0.3,
    maxRetries: 1,
  });
};

const trackingPromptTemplate = PromptTemplate.fromTemplate(`
You are Pro Fast Delivery System's courteous and accurate logistics delivery assistant AI.
Explain the parcel's status to the customer in a warm, polite, and reassuring tone strictly in the English language.

Parcel Details:
- Tracking ID: {trackingId}
- Current Delivery Status: {deliveryStatus}
- Payment Status: {paymentStatus}
- Amount Payable: {cost} BDT
- Sender Location: {senderAddress}
- Receiver Location: {receiverAddress}
- Assigned Rider: {riderName}
- Latest Activity Note: {latestNote}
- Last Updated: {lastUpdated}

Rules:
1. Explain clearly where the parcel is and what the next step is.
2. If payment status is unpaid, remind the recipient to have {cost} BDT ready upon delivery.
3. Keep the total response within 2 to 3 sentences maximum.
4. Do not invent fictional hubs or tracking events not mentioned above.
5. All responses MUST be strictly in the English language.
`);

const buildFallbackExplanation = (parcel, latestTracking) => {
  const trackingId = parcel.tracking_id;
  const status = parcel.delivery_status || "in_transit";
  const cost = parcel.cost || 0;
  const isPaid = parcel.payment_status === "paid";
  const paymentNote = isPaid
    ? "Payment has been completed."
    : `Please keep ${cost} BDT ready upon delivery.`;
  const riderNote = parcel.assigned_rider_name
    ? ` Assigned rider: ${parcel.assigned_rider_name}.`
    : "";

  switch (status) {
    case "delivered":
      return `Your parcel (${trackingId}) has been delivered successfully. Thank you for choosing Pro Fast Delivery System!`;
    case "in_transit":
      return `Your parcel (${trackingId}) is currently on the way to ${parcel.receiver_address || "the destination address"}.${riderNote} ${paymentNote}`;
    case "rider_assigned":
      return `A rider (${parcel.assigned_rider_name || "Delivery Specialist"}) has been assigned to your parcel (${trackingId}) and pickup is underway. ${paymentNote}`;
    case "service_center_delivered":
      return `Your parcel (${trackingId}) has arrived at the nearest Pro Fast service center and will be dispatched for final delivery shortly.`;
    case "cancelled":
      return `The delivery for parcel (${trackingId}) was cancelled. Please contact customer care for further assistance.`;
    case "not_collected":
    default:
      return `Your parcel (${trackingId}) is registered and awaiting pickup from the sender.${riderNote} ${paymentNote}`;
  }
};

export async function explainTrackingStatus(parcel, latestTracking = null) {
  const trackingId = parcel.tracking_id;
  const deliveryStatus = parcel.delivery_status || "pending";
  const paymentStatus = parcel.payment_status || "unpaid";
  const cost = parcel.cost || 0;
  const senderAddress = parcel.sender_address || "Sender address on file";
  const receiverAddress = parcel.receiver_address || "Destination address on file";
  const riderName = parcel.assigned_rider_name || "Not yet assigned";
  const latestNote = latestTracking?.message || latestTracking?.note || "Parcel processed normally";
  const lastUpdated = latestTracking?.timestamp
    ? new Date(latestTracking.timestamp).toLocaleString("en-US", { timeZone: "UTC" })
    : new Date().toLocaleString("en-US", { timeZone: "UTC" });

  const inputVariables = {
    trackingId,
    deliveryStatus: deliveryStatus.replace(/_/g, " "),
    paymentStatus,
    cost: cost.toString(),
    senderAddress,
    receiverAddress,
    riderName,
    latestNote,
    lastUpdated,
  };

  const primaryModel = process.env.OPENROUTER_PRIMARY_MODEL || PRIMARY_MODEL;
  const fallbackModel = process.env.OPENROUTER_SECONDARY_MODEL || FALLBACK_MODEL;

  // Attempt 1: Primary Model
  try {
    const model = createModelInstance(primaryModel);
    const chain = trackingPromptTemplate.pipe(model).pipe(new StringOutputParser());
    const explanation = await chain.invoke(inputVariables);

    if (explanation && explanation.trim().length > 0) {
      return {
        tracking_id: trackingId,
        delivery_status: deliveryStatus,
        explanation: explanation.trim(),
        is_fallback: false,
        model_used: primaryModel,
        generated_at: new Date().toISOString(),
      };
    }
  } catch (primaryErr) {
    console.warn(`[AI Service] Primary model (${primaryModel}) failed:`, primaryErr?.message || primaryErr);
  }

  // Attempt 2: Secondary / Fallback Model
  try {
    const model = createModelInstance(fallbackModel);
    const chain = trackingPromptTemplate.pipe(model).pipe(new StringOutputParser());
    const explanation = await chain.invoke(inputVariables);

    if (explanation && explanation.trim().length > 0) {
      return {
        tracking_id: trackingId,
        delivery_status: deliveryStatus,
        explanation: explanation.trim(),
        is_fallback: false,
        model_used: fallbackModel,
        generated_at: new Date().toISOString(),
      };
    }
  } catch (secondaryErr) {
    console.warn(`[AI Service] Fallback model (${fallbackModel}) failed:`, secondaryErr?.message || secondaryErr);
  }

  // Attempt 3: Zero-crash Deterministic Template Fallback
  return {
    tracking_id: trackingId,
    delivery_status: deliveryStatus,
    explanation: buildFallbackExplanation(parcel, latestTracking),
    is_fallback: true,
    model_used: "deterministic_template",
    generated_at: new Date().toISOString(),
  };
}

export default { explainTrackingStatus };
