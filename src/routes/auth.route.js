import { Router } from "express";
import {
  changeCurrentPassword,
  forgotPasswordRequest,
  getCurrentUser,
  login,
  logoutUser,
  provideRefreshToken,
  registerUser,
  resendVerificationEmail,
  resetForgotPassword,
  verifyEmail,
} from "../controllers/auth.controller.js";
import {
  userChangeCurrentPassValidator,
  userForgotPassValidator,
  userLoginValidator,
  userValidations,
} from "../validations/user.validations.js";
import validateUser from "../middleware/userValidator.mid.js";
import { authorize } from "../middleware/auth.mid.js";

const router = Router();

// open routes
router.route("/register").post(userValidations(), validateUser, registerUser);

router.route("/login").post(userLoginValidator(), validateUser, login);

router.route("/verify-email/:verificationToken").get(verifyEmail);

router.route("/refresh-token").post(provideRefreshToken);

router
  .route("/forgot-password")
  .post(userForgotPassValidator(), validateUser, forgotPasswordRequest);

router
  .route("/reset-password/:resetToken")
  .post(userForgotPassValidator(), validateUser, resetForgotPassword);

// secured routes

router.route("/logout").post(authorize, logoutUser);

router.route("/current-user").post(authorize, getCurrentUser);

router
  .route("/change-password")
  .post(authorize, userChangeCurrentPassValidator(), validateUser, changeCurrentPassword);

router.route("/resend-email-verification").post(authorize, resendVerificationEmail);

export default router;
