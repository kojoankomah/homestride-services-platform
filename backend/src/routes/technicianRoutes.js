const express = require("express");

const {
  createTechnician,
  updateTechnician,
  updateTechnicianAccountStatus,
  getTechnicians
} = require("../controllers/technicianController");

const authenticate = require(
  "../middleware/authMiddleware"
);

const authorizeRoles = require(
  "../middleware/roleMiddleware"
);

const validateTechnician = require(
  "../validators/technicianValidator"
);

const {
  validateTechnicianUpdate,
  validateTechnicianAccountStatus
} = require(
  "../validators/technicianManagementValidator"
);

const router = express.Router();

router.get(
  "/",
  authenticate,
  authorizeRoles("admin"),
  getTechnicians
);

router.post(
  "/",
  authenticate,
  authorizeRoles("admin"),
  validateTechnician,
  createTechnician
);

router.patch(
  "/:technicianId/status",
  authenticate,
  authorizeRoles("admin"),
  validateTechnicianAccountStatus,
  updateTechnicianAccountStatus
);

router.patch(
  "/:technicianId",
  authenticate,
  authorizeRoles("admin"),
  validateTechnicianUpdate,
  updateTechnician
);

module.exports = router;