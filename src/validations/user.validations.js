import { body } from "express-validator";

const userValidations = () => {
  return [
    body("email")
      .isEmail()
      .withMessage("please enter a valid email format")
      .notEmpty()
      .withMessage("Email is required, please specify!")
      .trim(),

    body("username")
      .isLength({ min: 4 })
      .withMessage("username must be atleast 4 chars in length")
      .notEmpty()
      .withMessage("username can't be empty")
      .isLowercase()
      .withMessage("please specify username in lowercase")
      .trim(),

    body("password")
      .notEmpty()
      .withMessage("password can't be empty!")
      .isLength({ min: 8 })
      .withMessage("password must be atleast 8 chars in length")
      .trim(),

    body("fullName")
      .optional()
      .notEmpty()
      .withMessage("full Name can't be empty")
      .isLength({ min: 5 })
      .withMessage("full name must be atleast 5 chars in length")
      .trim(),
  ];
};

const userLoginValidator = () => {
  return [
    body("email")
      .optional()
      .notEmpty()
      .withMessage("Email is required, please specify!")
      .isEmail()
      .withMessage("Email is invalid")
      .trim(),

    body("password")
      .notEmpty()
      .withMessage("Password is required")
      .isLength({ min: 8 })
      .withMessage("password must be atleast 8 chars in length")
      .trim(),
  ];
};

const userChangeCurrentPassValidator = () => {
  return [
    body("oldPassword").notEmpty().withMessage("old password is required!"),
    body("newPassword")
      .notEmpty()
      .withMessage("old password is required!")
      .isLength({ min: 8 })
      .withMessage("new password must be atleast 8 chars in length")
      .trim(),
  ];
};

const userForgotPassValidator = () => {
  return [
    body("newPassword")
       .notEmpty()
      .withMessage("old password is required!")
      .isLength({ min: 8 })
      .withMessage("new password must be atleast 8 chars in length")
      .trim()
  ];
};

const userResetForgotPassValidator = () => {
  return [body("newPassword").notEmpty().withMessage("Password is required!")];
};

export {
  userValidations,
  userLoginValidator,
  userChangeCurrentPassValidator,
  userForgotPassValidator,
  userResetForgotPassValidator,
};
