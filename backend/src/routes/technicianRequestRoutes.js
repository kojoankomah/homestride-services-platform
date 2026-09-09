const express = require("express");

const {
  getAssignedRequests,
  updateRequestStatus
} = require(
  "../controllers/technicianRequestController"
);

const authenticate = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(
  authenticate,
  authorizeRoles("technician")
);

router.get("/", getAssignedRequests);

router.patch(
  "/:requestId/status",
  updateRequestStatus
);

module.exports = router;