const express = require("express");
const createUserControllers = require("../controllers/userController");

const createUserRoutes = (usersCollection, verifyFBToken, verifyAdmin) => {
  const router = express.Router();
  const userController = createUserControllers(usersCollection);

  router.post("/", userController.createUser);
  router.get("/search", userController.searchUsers);
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
