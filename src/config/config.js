import dotenv from "dotenv";
dotenv.config();

let serviceAccount = null;
try {
  if (process.env.FB_SERVICE_KEY) {
    const decodedKey = Buffer.from(process.env.FB_SERVICE_KEY, "base64").toString(
      "utf8",
    );
    serviceAccount = JSON.parse(decodedKey);
  } else {
    console.warn("⚠️ Warning: FB_SERVICE_KEY is not defined in environment variables");
  }
} catch (err) {
  console.error("❌ Error parsing FB_SERVICE_KEY:", err.message);
}

const config = {
  port: process.env.PORT || 5000,
  stripeKey: process.env.PAYMENT_GATEWAY_KEY,
  firebaseServiceAccount: serviceAccount,
  mongoURI:
    process.env.MONGODB_URI ||
    `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST || "project-cluster.iulg13z.mongodb.net"}/?appName=Project-Cluster`,
};

export default config;
