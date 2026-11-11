import express, { Request, Response } from "express";
import cors, { CorsOptions } from "cors";
import { MongoClient, ServerApiVersion } from "mongodb";
import admin from "firebase-admin";
import Stripe from "stripe";
import config from "./config/config.js";
import createAuthMiddleware from "./middleware/authMiddleware.js";
import createPaymentRoutes from "./routes/paymentRoutes.js";
import createUserRoutes from "./routes/userRoutes.js";
import createBusinessRoutes from "./routes/businessRoutes.js";
import createEmployeeRoutes from "./routes/employeeRoutes.js";
import createTrackingRoutes from "./routes/trackingRoutes.js";

const stripe = new Stripe(config.stripeKey || "");

const app = express();
const port = config.port;

const corsOptions: CorsOptions = {
  origin: [
    "http://localhost:5173",
    "https://zap-shift-abec3.web.app",
    "https://zap-shift-abec3.firebaseapp.com",
  ],
  credentials: true,
  optionsSuccessStatus: 200,
};

// Middlewares
app.use(cors(corsOptions));
app.use(express.json());

if (config.firebaseServiceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(config.firebaseServiceAccount),
  });
} else {
  console.warn("⚠️ Firebase Admin not initialized: missing or invalid service account");
}

// --------------------------------------------------------------

const uri = config.mongoURI;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run(): Promise<void> {
  try {
    const db = client.db("parcelDB");
    const parcelsCollection = db.collection("parcels");
    const usersCollection = db.collection("users");
    const paymentsCollection = db.collection("payments");
    const trackingsCollection = db.collection("tracking");
    const ridersCollection = db.collection("riders");

    //--------------------Middle Ware Starts---------------------------
    const { verifyFBToken, verifyAdmin, verifyRider } =
      createAuthMiddleware(usersCollection);

    //--------------------Middle Ware Ends---------------------------

    //--------------------API Starts---------------------------

    app.use(
      "/payment",
      createPaymentRoutes(
        parcelsCollection,
        paymentsCollection,
        stripe,
        verifyFBToken,
      ),
    );
    app.use(
      "/users",
      createUserRoutes(
        usersCollection,
        parcelsCollection,
        verifyFBToken,
        verifyAdmin,
      ),
    );
    app.use(
      "/business",
      createBusinessRoutes(
        parcelsCollection,
        ridersCollection,
        verifyFBToken,
        verifyRider,
      ),
    );
    app.use(
      "/employee",
      createEmployeeRoutes(
        ridersCollection,
        usersCollection,
        parcelsCollection,
        verifyFBToken,
        verifyAdmin,
      ),
    );
    app.use(
      "/tracking",
      createTrackingRoutes(
        trackingsCollection,
        parcelsCollection,
        ridersCollection,
        paymentsCollection,
      ),
    );

    //--------------------API Ends---------------------------
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir);

// --------------------------------------------------------------

app.get("/", (req: Request, res: Response) => {
  res.send("Percel Server is running");
});

app.listen(port, () => {
  console.log(`Percel Server is running on port ${port}`);
});

export default app;
