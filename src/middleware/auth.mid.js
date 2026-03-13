import { User } from "../models/user.model.js";
import { apiError } from "../utils/apiErrorResponse.js";
import asyncHandlerFunction from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

export const authorize = asyncHandlerFunction(async (req, res, next) => {
  const token = req.cookies?.accessToken || req.header("Authorization")?.split(" ")[1];

  if (!token) {
    throw new apiError(401, "Unathorized request");
  }

  try {
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken -emailVerificationToken -emailVerficationExpiry",
    );

    if (!user) {
      throw new apiError(401, "Invalid access token!");
    }
    console.log(user);
    req.user = user;
    next();
  } catch (error) {
    throw new apiError(401, "Invalid access token!");
  }
});
