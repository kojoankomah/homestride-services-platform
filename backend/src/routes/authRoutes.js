const express = require("express");

const {
  registerCustomer,
  login
} = require("../controllers/authController");

const {
  validateRegistration,
  validateLogin
} = require("../validators/authValidator");

const router = express.Router();

router.post(
  "/register",
  validateRegistration,
  registerCustomer
);

router.post(
  "/login",
  validateLogin,
  login
);

module.exports = router;