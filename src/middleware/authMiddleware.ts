import { Request, Response, NextFunction } from "express";
import admin from "firebase-admin";
import type { Collection } from "mongodb";

export interface AuthenticatedRequest extends Request {
  decoded?: admin.auth.DecodedIdToken;
}

export interface AuthMiddleware {
  verifyFBToken: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<any>;
  verifyAdmin: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<any>;
  verifyRider: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<any>;
}

const createAuthMiddleware = (usersCollection: Collection<any>): AuthMiddleware => {
  const verifyFBToken = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<any> => {
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

  const verifyAdmin = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<any> => {
    if (!req.decoded?.email) {
      return res.status(403).send({ message: "forbidden access" });
    }
    const email = req.decoded.email;
    const query = { email };
    const user = await usersCollection.findOne(query);
    if (!user || user.role !== "admin") {
      return res.status(403).send({ message: "forbidden access" });
    }
    next();
  };

  const verifyRider = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<any> => {
    if (!req.decoded?.email) {
      return res.status(403).send({ message: "forbidden access" });
    }
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
