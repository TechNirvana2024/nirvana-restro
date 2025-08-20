const joi = require("joi");

const httpStatus = require("http-status");
const isEmpty = require("../helpers/is-empty-helper");
const responseHelper = require("../helpers/response-helper");
const { validateRequestBody } = require("../helpers/validator-helper");
const messageConstant = require("../constants/message-constant");

const productPostValidation = async (req, res, next) => {
  let joiModel = joi.object({
    productCategoryId: joi.number().integer().positive().required(),
    name: joi.string().trim().min(1).required(),
    alias: joi
      .alternatives()
      .try(joi.array().items(joi.string()), joi.object()),
    description: joi.string().required(),
    // remaining_quantity: joi.number().required(),
    quantity: joi.number().integer().min(0).required(),
    price: joi.number().precision(2).min(0).required(),
    mediaArr: joi.array().items(joi.string()).optional(),
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

const productPutValidation = async (req, res, next) => {
  let joiModel = joi.object({
    productCategoryId: joi.number().integer().positive().optional(),
    name: joi.string().trim().min(1).optional(),
    alias: joi
      .alternatives()
      .try(joi.array().items(joi.string()), joi.object()),
    description: joi.string().optional(),
    quantity: joi.number().integer().min(0).optional(),
    price: joi.number().precision(2).min(0).optional(),
    order: joi.number().precision(2).min(0).optional(),
    mediaArr: joi.array().items(joi.string()).optional(),
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
const orderPutValidation = async (req, res, next) => {
  console.log("hey");
  let joiModel = joi.object({
    orders: joi
      .array()
      .required()
      .min(1)
      .items(
        joi.object({
          id: joi.number().integer().positive().required().messages({
            "number.base": "ID must be a number",
            "number.integer": "ID must be an integer",
            "number.positive": "ID must be a positive number",
            "any.required": "ID is required",
          }),
          order: joi.number().integer().min(0).required().messages({
            "number.base": "Order must be a number",
            "number.integer": "Order must be an integer",
            "number.min": "Order must be non-negative",
            "any.required": "Order is required",
          }),
        }),
      )
      .unique((a, b) => a.id === b.id)
      .messages({
        "array.base": "Request body must be an array",
        "array.min": "Array must not be empty",
        "array.unique": "Duplicate IDs are not allowed",
      }),
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
  productPostValidation,
  productPutValidation,
  orderPutValidation,
};
