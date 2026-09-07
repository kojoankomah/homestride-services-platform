const express = require("express");

const {
  createTechnician
} = require("../controllers/technicianController");

const authenticate = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const validateTechnician = require(
  "../validators/technicianValidator"
);

const router = express.Router();

router.post(
  "/",
  authenticate,
  authorizeRoles("admin"),
  validateTechnician,
  createTechnician
);

module.exports = router;