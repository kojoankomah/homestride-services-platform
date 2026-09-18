const express = require("express");

const {
  getCurrentUser,
  changePassword
} = require("../controllers/userController");

const authenticate = require(
  "../middleware/authMiddleware"
);

const validatePasswordChange = require(
  "../validators/passwordValidator"
);

const router = express.Router();

router.get(
  "/me",
  authenticate,
  getCurrentUser
);

router.patch(
  "/password",
  authenticate,
  validatePasswordChange,
  changePassword
);

module.exports = router;