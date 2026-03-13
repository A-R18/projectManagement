import { ApiResponse } from "../utils/apiResponse.js";
import { apiError } from "../utils/apiErrorResponse.js";
import asyncHandlerFunction from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { sendEmail, verificationMailContent, forgotPasswordContent } from "../utils/mail.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const genAccAndRefTokenz = async (userId) => {
  try {
    // console.log("user id is: ",userId);
    const user = await User.findById(userId);
    const accessTokengen = user.genAccessToken(userId);
    const refreshTokengen = user.genRefreshToken(userId);
    // console.log(accessTokengen, refreshTokengen);
    user.refreshToken = refreshTokengen;
    await user.save({ validateBeforeSave: false });
    return { accessTokengen, refreshTokengen };
  } catch (error) {
    throw new apiError(500, "something went wrong while generating access token");
  }
};

const registerUser = asyncHandlerFunction(async (req, res) => {
  const { email, username, password, role } = req.body;
  const userExists = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (userExists) {
    throw new apiError(409, "User with provided email or username already exists!");
  }

  const userCreated = await User.create({
    email,
    password,
    username,
    role,
    isEmailVerified: false,
  });

  const { unHashedToken, hashedToken, tokenExpiry } = userCreated.genTemporaryToken();

  // console.log(unHashedToken,"\n", hashedToken,"\n", "Token expiry is: ", tokenExpiry);

  userCreated.emailVerificationToken = hashedToken;
  userCreated.emailVerificationExpiry = tokenExpiry;
  await userCreated.save({ validateBeforeSave: false });

  await sendEmail({
    email: userCreated?.email,
    subject: "Please verify your email",
    mailgenContent: verificationMailContent(
      userCreated.username,
      `${req.protocol}://${req.get("host")}/api/v1/users/verify-email${unHashedToken}`,
    ),
  });

  const createdUser = await User.findById(userCreated._id).select(
    "-password -refreshToken -emailVerificationToken -emailVerficationExpiry",
  );

  if (!createdUser) {
    throw new apiError(500, "DB error, failed to create/save user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, { user: createdUser }, "Successfully registered user!"));
});

const login = asyncHandlerFunction(async (req, res) => {
  const { email, password } = req.body;
  if (!email) {
    throw new apiError(400, "Email is required");
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new apiError(400, "User doesn't exist");
  }
  const passwordMatched = await user.matchPassword(password);

  // return res.json(passwordMatched);
  if (!passwordMatched) {
    throw new apiError(400, "Invalid credentials");
  }
  // console.log(user._id);
  const { accessTokengen, refreshTokengen } = await genAccAndRefTokenz(user._id);

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken -emailVerificationToken -emailVerficationExpiry",
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessTokengen, options)
    .cookie("refreshToken", refreshTokengen, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken: accessTokengen,
          refreshToken: refreshTokengen,
        },
        "login successfull",
      ),
    );
});

const logoutUser = asyncHandlerFunction(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: "",
      },
    },
    {
      new: true,
    },
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out!"));
});

const getCurrentUser = asyncHandlerFunction(async (req, res) => {
  return res.status(200).json(new ApiResponse(200, req.user, "current user fetched successfully!"));
});

const verifyEmail = asyncHandlerFunction(async (req, res) => {
  const { verificationToken } = req.params;
  const hashedToken = crypto.createHash("sha256").update(verificationToken).digest("hex");

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpiry: { $gt: Date.now() },
  });

  if (!user) {
    throw new apiError(400, "Token is invalid or expired");
  }
  user.emailVerificationToken = undefined;
  user.emailVerificationExpiry = undefined;

  user.isEmailVerified = true;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, { isEmailVerified: true }, "Email is verified!"));
});



const resendVerificationEmail = asyncHandlerFunction(async (req, res) => {
  const user = await User.findById(req.user?._id);
  if (!user) {
    throw new apiError(404, "User doesn't exist");
  }

  if (user.isEmailVerified) {
    throw new apiError(404, "User is already verified!");
  }

  const { unHashedToken, hashedToken, tokenExpiry } = user.genTemporaryToken();

  user.emailVerificationToken = hashedToken;
  user.emailVerificationExpiry = tokenExpiry;
  await user.save({ validateBeforeSave: false });

  await sendEmail({
    email: user?.email,
    subject: "Please verify your email",
    mailgenContent: verificationMailContent(
      user.username,
      `${req.protocol}://${req.get("host")}/api/v1/users/verify-email${unHashedToken}`,
    ),
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, `Verification mail has been sent to ${user.email}`));
});

const provideRefreshToken = asyncHandlerFunction(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new apiError(401, "unauthorized access");
  }

  try {
    const decodedTokenVerified = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decodedTokenVerified?._id);

    if (!user) {
      throw new apiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new apiError(401, "Refresh token is expired");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessTokengen, refreshTokengen } = await genAccAndRefTokenz(user._id);

    user.refreshToken = refreshTokengen;
    await user.save({ validateBeforeSave: false });
    return res
      .status(200)
      .cookie("accessToken", accessTokengen, options)
      .cookie("refreshToken", refreshTokengen, options)
      .json(
        new ApiResponse(
          200,
          { accessToken: accessTokengen, refreshToken: refreshTokengen },
          "Access token refreshed",
        ),
      );
  } catch (error) {
    throw new apiError(401, "Invalid refresh token!");
  }
});

const forgotPasswordRequest = asyncHandlerFunction(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    throw new apiError(404, "User doesn't exist!");
  }
  const { unHashedToken, hashedToken, tokenExpiry } = user.genTemporaryToken();

  user.forgotPasswordToken = hashedToken;
  user.forgotPasswordExpiry = tokenExpiry;

  await user.save({ validateBeforeSave: false });

  await sendEmail({
    email: user?.email,
    subject: "PASSWORD RESET REQUEST",
    mailgenContent: forgotPasswordContent(
      user.username,
      `${process.env.FORGOT_PASS_REDIRECT_URL}/${unHashedToken}`,
    ),
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password reset mail has been sent on your Email ID"));
});

const resetForgotPassword = asyncHandlerFunction(async (req, res) => {
  const { resetToken } = req.params;
  const { newPassword } = req.body;
  let hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");
console.log(hashedToken);
  const user = await User.findOne({
    forgotPasswordToken: hashedToken,
    forgotPasswordExpiry: { $gt: Date.now() },
  });

  console.log(user);

  if (!user) {
    throw new apiError(489, "Token is invalid or expired!");
  }

  user.forgotPasswordExpiry = undefined;
  user.forgotPasswordToken = undefined;

  user.password = newPassword;

  await user.save({ validateBeforeSave: false });

  return res.status(200).json(new ApiResponse(200, {}, "Password reset successfully!"));
});

const changeCurrentPassword = asyncHandlerFunction(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  // console.log(oldPassword,"\n", newPassword );
  const user = await User.findById(req.user?._id);
  // console.log(user);

  const isPasswordValid = await user.matchPassword(oldPassword);
  console.log(isPasswordValid);

  if (!isPasswordValid) {
    throw new apiError(400, "Invalid old Password");
  }
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res.status(200).json(new ApiResponse(200, {}, "Password changed successfully!"));
});

export {
  registerUser,
  login,
  logoutUser,
  getCurrentUser,
  verifyEmail,
  resendVerificationEmail,
  provideRefreshToken,
  forgotPasswordRequest,
  resetForgotPassword,
  changeCurrentPassword,
};