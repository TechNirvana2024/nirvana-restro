const joi = require("joi");
const httpStatus = require("http-status");
const responseHelper = require("../helpers/response-helper");
const {
  validateRequestParams,
  validateRequestQuery,
} = require("../helpers/validator-helper");
const messageConstant = require("../constants/message-constant");
const isEmpty = require("../helpers/is-empty-helper");

const idValidation = async (req, res, next) => {
  let joiModel = joi.object({
    id: joi.number().required().label("id"),
  });
  const errors = await validateRequestParams(req, res, joiModel);
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

const slugValidation = async (req, res, next) => {
  let joiModel = joi.object({
    slug: joi
      .string()
      .custom((value, helpers) => {
        if (!isNaN(value)) {
          return helpers.error("any.invalid"); // Reject if it's a number
        }
        return value;
      })
      .label("slug"),
  });
  const errors = await validateRequestParams(req, res, joiModel);
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

const paginationValidation = async (req, res, next) => {
  let joiModel = joi.object({
    page: joi.number().optional().label("page"),
    limit: joi.number().optional().label("limit"),
    isDeleted: joi.boolean().optional().label("isDeleted"),
    mediaCategoryId: joi.number().optional().label("id"),
    title: joi.string().optional().label("title"),
    initials: joi.string().optional().label("initials"),
    username: joi.string().optional().label("username"),
    email: joi.string().optional().label("email"),
    status: joi.string().optional().label("status"),
    slug: joi.string().optional().label("slug"),
    departmentId: joi.number().optional().label("departmentId"),
    pageName: joi.string().optional().label("Page Name"),
    isRead: joi.boolean().optional().label("isRead"),
    templateName: joi.string().optional().label("templateName"),
    templateKey: joi.string().optional().label("templateKey"),
    category: joi.number().optional().label("Product Category"),
    isEmailedVerified: joi.boolean().optional().label("Is Email Verified"),
    userType: joi
      .string()
      .optional()
      .valid("guest", "customer")
      .label("User Type"),
    date: joi.string().optional().label("Date"),
    createdAt: joi.string().optional().label("Created At"),
    orderDate: joi.string().optional().label("Order Date"),
  });
  const errors = await validateRequestQuery(req, res, joiModel);
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
  idValidation,
  slugValidation,
  paginationValidation,
};
