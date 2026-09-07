const express = require("express");

const authenticate = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/me",
  authenticate,
  (request, response) => {
    response.status(200).json({
      success: true,
      user: request.user
    });
  }
);

module.exports = router;