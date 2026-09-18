const bcrypt = require("bcryptjs");

const pool = require("../config/database");

function getCurrentUser(request, response) {
  response.status(200).json({
    success: true,
    user: request.user
  });
}

async function changePassword(
  request,
  response,
  next
) {
  try {
    const {
      currentPassword,
      newPassword
    } = request.body;

    const result = await pool.query(
      `
        SELECT password_hash
        FROM users
        WHERE id = $1
        LIMIT 1
      `,
      [request.user.id]
    );

    const account = result.rows[0];

    if (!account) {
      response.status(404).json({
        success: false,
        message: "The user account could not be found."
      });

      return;
    }

    const currentPasswordIsValid =
      await bcrypt.compare(
        currentPassword,
        account.password_hash
      );

    if (!currentPasswordIsValid) {
      response.status(400).json({
        success: false,
        message: "The current password is incorrect.",
        errors: {
          currentPassword:
            "The current password is incorrect."
        }
      });

      return;
    }

    const newPasswordHash = await bcrypt.hash(
      newPassword,
      12
    );

    await pool.query(
      `
        UPDATE users
        SET password_hash = $1
        WHERE id = $2
      `,
      [
        newPasswordHash,
        request.user.id
      ]
    );

    response.status(200).json({
      success: true,
      message:
        "Your password has been changed successfully. Please sign in again."
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getCurrentUser,
  changePassword
};