import admin from "firebase-admin";

const createAuthMiddleware = (usersCollection) => {
  const verifyFBToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).send({ message: "Unauthorized Access" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).send({ message: "Unauthorized Access" });
    }

    // verify the token
    try {
      const decoded = await admin.auth().verifyIdToken(token);
      req.decoded = decoded;
      next();
    } catch (error) {
      return res.status(403).send({ message: "Forbidden Access" });
    }
  };

  const verifyAdmin = async (req, res, next) => {
    const email = req.decoded.email;
    const query = { email };
    const user = await usersCollection.findOne(query);
    if (!user || user.role !== "admin") {
      return res.status(403).send({ message: "forbidden access" });
    }
    next();
  };

  const verifyRider = async (req, res, next) => {
    const email = req.decoded.email;
    const query = { email };
    const user = await usersCollection.findOne(query);
    if (!user || user.role !== "rider") {
      return res.status(403).send({ message: "forbidden access" });
    }
    next();
  };

  return {
    verifyFBToken,
    verifyAdmin,
    verifyRider,
  };
};

export default createAuthMiddleware;
