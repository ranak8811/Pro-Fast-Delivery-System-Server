const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const admin = require("firebase-admin");
const config = require("./config/config");
const createAuthMiddleware = require("./middleware/authMiddleware");

const stripe = require("stripe")(config.stripeKey);

const app = express();
const port = config.port;

// Middlewares
app.use(cors());
app.use(express.json());

admin.initializeApp({
  credential: admin.credential.cert(config.firebaseServiceAccount),
});

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

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

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

    const createPaymentRoutes = require("./routes/paymentRoutes");
    const createUserRoutes = require("./routes/userRoutes");
    const createBusinessRoutes = require("./routes/businessRoutes");
    const createEmployeeRoutes = require("./routes/employeeRoutes");
    const createTrackingRoutes = require("./routes/trackingRoutes");

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
      createUserRoutes(usersCollection, verifyFBToken, verifyAdmin),
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
    app.use("/tracking", createTrackingRoutes(trackingsCollection));

    //--------------------API Ends---------------------------

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log(
    //   "Pinged your deployment. You successfully connected to MongoDB!",
    // );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// --------------------------------------------------------------

app.get("/", (req, res) => {
  res.send("Percel Server is running");
});

app.listen(port, () => {
  console.log(`Percel Server is running on port ${port}`);
});
