import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import dotenv from "dotenv";
import type { Parcel } from "../types/parcel.js";
import type { TrackingEntry } from "../types/tracking.js";
import type { AITrackingExplainResponse } from "../types/ai.js";

dotenv.config();

const PRIMARY_MODEL = "liquid/lfm-3-1.7b:free";
const FALLBACK_MODEL = "meta-llama/llama-3.2-3b-instruct:free";

const createModelInstance = (modelName: string) => {
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

const buildFallbackExplanation = (parcel: Parcel, latestTracking?: TrackingEntry): string => {
  const statusDescriptions: Record<string, string> = {
    not_collected: "Your parcel has been booked and is currently waiting for rider pickup.",
    rider_assigned: `A rider (${parcel.assigned_rider_name || "Assigned Agent"}) is on their way to pick up your parcel.`,
    in_transit: `Your parcel is currently in transit to ${parcel.receiver_address}.`,
    service_center_delivered: "Your parcel has arrived safely at the local distribution hub and is being prepped for dispatch.",
    delivered: "Your parcel has been successfully delivered. Thank you for choosing Pro Fast Delivery System!",
    cancelled: "This parcel delivery order has been cancelled.",
  };

  const baseStatus =
    statusDescriptions[parcel.delivery_status] ||
    `Your parcel is currently in '${parcel.delivery_status}' status.`;

  const paymentReminder =
    parcel.payment_status === "unpaid"
      ? ` Please have ${parcel.cost} BDT ready for Cash on Delivery upon arrival.`
      : " Payment is fully cleared.";

  return `${baseStatus}${paymentReminder}`;
};

export const explainTrackingStatus = async (
  parcel: Parcel,
  trackingLogs: TrackingEntry[] = []
): Promise<AITrackingExplainResponse> => {
  const latestTracking = trackingLogs.length > 0 ? trackingLogs[0] : undefined;

  const promptVariables = {
    trackingId: parcel.tracking_id || "N/A",
    deliveryStatus: parcel.delivery_status || "in_transit",
    paymentStatus: parcel.payment_status || "unpaid",
    cost: parcel.cost?.toString() || "0",
    senderAddress: parcel.sender_address || "Sender Hub",
    receiverAddress: parcel.receiver_address || "Receiver Location",
    riderName: parcel.assigned_rider_name || "Designated Delivery Rider",
    latestNote: latestTracking?.message || latestTracking?.note || "Parcel is on schedule.",
    lastUpdated: latestTracking?.timestamp || parcel.creation_date || new Date().toISOString(),
  };

  // Attempt 1: Primary Model (liquid/lfm-3-1.7b:free)
  try {
    const primaryModel = createModelInstance(PRIMARY_MODEL);
    const chain = trackingPromptTemplate.pipe(primaryModel).pipe(new StringOutputParser());
    const explanation = await chain.invoke(promptVariables);

    return {
      tracking_id: parcel.tracking_id,
      delivery_status: parcel.delivery_status,
      explanation: explanation.trim(),
      is_fallback: false,
      model_used: PRIMARY_MODEL,
      generated_at: new Date().toISOString(),
    };
  } catch (primaryError: any) {
    // If upstream 429 or rate limit, attempt secondary fallback model
    try {
      const fallbackModel = createModelInstance(FALLBACK_MODEL);
      const chain = trackingPromptTemplate.pipe(fallbackModel).pipe(new StringOutputParser());
      const explanation = await chain.invoke(promptVariables);

      return {
        tracking_id: parcel.tracking_id,
        delivery_status: parcel.delivery_status,
        explanation: explanation.trim(),
        is_fallback: false,
        model_used: FALLBACK_MODEL,
        generated_at: new Date().toISOString(),
      };
    } catch (secondaryError) {
      // Deterministic zero-crash template fallback
      return {
        tracking_id: parcel.tracking_id,
        delivery_status: parcel.delivery_status,
        explanation: buildFallbackExplanation(parcel, latestTracking),
        is_fallback: true,
        model_used: "deterministic-fallback",
        generated_at: new Date().toISOString(),
      };
    }
  }
};
