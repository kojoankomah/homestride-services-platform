const express = require("express");

const {
  getAllServiceRequests,
  assignTechnician
} = require("../controllers/adminRequestController");

const authenticate = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(
  authenticate,
  authorizeRoles("admin")
);

router.get("/", getAllServiceRequests);

router.patch(
  "/:requestId/assign",
  assignTechnician
);

module.exports = router;