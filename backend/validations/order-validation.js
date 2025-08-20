const joi = require("joi");
const httpStatus = require("http-status");
const responseHelper = require("../helpers/response-helper");
const messageConstant = require("../constants/message-constant");
const isEmpty = require("../helpers/is-empty-helper");

const {
  validateRequestBody,
  validateRequestParams,
} = require("../helpers/validator-helper");

const createOrderPostValidation = async (req, res, next) => {
  let joiModel = joi.object({
    idempotencyKey: joi.string().uuid().required(),
    address: joi.string().optional(),
    paymentMethod: joi.string().valid("cash", "stripe").required(),
    stripePaymentIntentId: joi.string().optional(),
    orderNote: joi.string().optional(),
    deliveryTime: joi.string().optional(),
    // deliveryType: joi.string().valid("delivery", "selfPick"),
    email: joi.string().required(),
    mobileNumber: joi.string().required(),
    city: joi.string().required(),
    pinCode: joi.string().required(),
    captchaToken: joi.string().required(),
  });
  const errors = await validateRequestBody(req, res, joiModel);
  if (!isEmpty(errors)) {
    return responseHelper.sendResponse(
      res,
      httpStatus.BAD_REQUEST,
      false,
      null,
      errors,
      messageConstant.EN.INPUT_ERROR,
      null,
    );
  }
  return next();
};

const incrementCartItemValidation = async (req, res, next) => {
  let joiModel = joi.object({
    // userId: joi.number().required(),
    productId: joi.number().required(),
    quantity: joi.number().integer().min(1).required(),
  });
  const errors = await validateRequestBody(req, res, joiModel);
  if (!isEmpty(errors)) {
    return responseHelper.sendResponse(
      res,
      httpStatus.BAD_REQUEST,
      false,
      null,
      errors,
      messageConstant.EN.INPUT_ERROR,
      null,
    );
  }
  return next();
};

const decrementCartItemValidation = async (req, res, next) => {
  let joiModel = joi.object({
    // userId: joi.number().required(),
    productId: joi.number().required(),
    quantity: joi.number().integer().min(1).required(),
  });
  const errors = await validateRequestBody(req, res, joiModel);
  if (!isEmpty(errors)) {
    return responseHelper.sendResponse(
      res,
      httpStatus.BAD_REQUEST,
      false,
      null,
      errors,
      messageConstant.EN.INPUT_ERROR,
      null,
    );
  }
  return next();
};

const removeCartValidation = async (req, res, next) => {
  let joiModel = joi.object({
    // userId: joi.number().required(),
    cartItemIds: joi.array().items(joi.number()).min(1),
  });
  const errors = await validateRequestBody(req, res, joiModel);
  if (!isEmpty(errors)) {
    return responseHelper.sendResponse(
      res,
      httpStatus.BAD_REQUEST,
      false,
      null,
      errors,
      messageConstant.EN.INPUT_ERROR,
      null,
    );
  }
  return next();
};

module.exports = {
  createOrderPostValidation,
  incrementCartItemValidation,
  decrementCartItemValidation,
  removeCartValidation,
};
