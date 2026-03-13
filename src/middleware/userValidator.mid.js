import { validationResult } from "express-validator";
import { apiError } from "../utils/apiErrorResponse.js";
const validateUser = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  const extractedErrors = [];
  errors.array().map((err) => extractedErrors.push({ [err.path]: err.msg }));

  console.log(extractedErrors);
  // console.log(errors);

  return next(new apiError(422, "Validation Errors:\n", extractedErrors));
};

export default validateUser;
