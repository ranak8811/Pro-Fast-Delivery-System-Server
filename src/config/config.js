const dotenv = require("dotenv").config();

const decodedKey = Buffer.from(process.env.FB_SERVICE_KEY, "base64").toString(
  "utf8",
);
const serviceAccount = JSON.parse(decodedKey);

const config = {
  port: process.env.PORT || 5000,
  stripeKey: process.env.PAYMENT_GATEWAY_KEY,
  firebaseServiceAccount: serviceAccount,
  mongoURI: `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@project-cluster.iulg13z.mongodb.net/?appName=Project-Cluster`,
};

module.exports = config;
