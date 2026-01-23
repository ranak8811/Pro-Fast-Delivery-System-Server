const express = require("express");
const createUserControllers = require("../controllers/userController");

const createUserRoutes = (
  usersCollection,
  parcelsCollection,
  verifyFBToken,
  verifyAdmin,
) => {
  const router = express.Router();
  const userController = createUserControllers(
    usersCollection,
    parcelsCollection,
  );

  router.post("/", userController.createUser);
  router.get("/search", userController.searchUsers);
  router.get(
    "/dashboard-summary-for-user",
    verifyFBToken,
    userController.getUserDashboardSummary,
  );
  router.get(
    "/parcels",
    verifyFBToken,
    userController.getUserParcels,
  );
  router.get("/:email", userController.getUserDetails);
  router.get("/:email/role", userController.getUserRole);
  router.patch(
    "/:id/role",
    verifyFBToken,
    verifyAdmin,
    userController.updateUserRole,
  );

  return router;
};

module.exports = createUserRoutes;
