const express = require("express");

const {
  createServiceRequest,
  getMyServiceRequests,
  getMyServiceRequestById
} = require("../controllers/requestController");

const authenticate = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const validateServiceRequest = require(
  "../validators/requestValidator"
);

const router = express.Router();

router.use(
  authenticate,
  authorizeRoles("customer")
);

router.get("/", getMyServiceRequests);
router.get("/:requestId", getMyServiceRequestById);
router.post("/", validateServiceRequest, createServiceRequest);

module.exports = router;