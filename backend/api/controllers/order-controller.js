const orderService = require("../services/order-service");
const responseHelper = require("../../helpers/response-helper");
const logger = require("../../configs/logger");

const createOrder = async (req, res, next) => {
  try {
    const result = await orderService.createOrder(req);
    return responseHelper.sendResponse(
      res,
      result.status,
      result.success,
      result.data,
      result.errors,
      result.message,
      result.token,
    );
  } catch (err) {
    logger.error(err);
    next(err);
  }
};
const incrementCartItem = async (req, res, next) => {
  try {
    const result = await orderService.incrementCartItem(req);
    return responseHelper.sendResponse(
      res,
      result.status,
      result.success,
      result.data,
      result.errors,
      result.message,
      result.token,
    );
  } catch (err) {
    logger.error(err);
    next(err);
  }
};
const decrementCartItem = async (req, res, next) => {
  try {
    const result = await orderService.decrementCartItem(req);
    return responseHelper.sendResponse(
      res,
      result.status,
      result.success,
      result.data,
      result.errors,
      result.message,
      result.token,
    );
  } catch (err) {
    logger.error(err);
    next(err);
  }
};
const createCheckoutSession = async (req, res, next) => {
  try {
    const result = await orderService.createCheckoutSession(req);
    return responseHelper.sendResponse(
      res,
      result.status,
      result.success,
      result.data,
      result.errors,
      result.message,
      result.token,
    );
  } catch (err) {
    logger.error(err);
    next(err);
  }
};

const paymentSuccess = async (req, res, next) => {
  try {
    const result = await orderService.paymentSuccess(req);
    return responseHelper.sendResponse(
      res,
      result.status,
      result.success,
      result.data,
      result.errors,
      result.message,
      result.token,
    );
  } catch (err) {
    logger.error(err);
    next(err);
  }
};
const paymentFailed = async (req, res, next) => {
  try {
    const result = await orderService.paymentFailed(req);
    return responseHelper.sendResponse(
      res,
      result.status,
      result.success,
      result.data,
      result.errors,
      result.message,
      result.token,
    );
  } catch (err) {
    logger.error(err);
    next(err);
  }
};
const deleteCarts = async (req, res, next) => {
  try {
    const result = await orderService.removeCartItems(req);
    return responseHelper.sendResponse(
      res,
      result.status,
      result.success,
      result.data,
      result.errors,
      result.message,
      result.token,
    );
  } catch (err) {
    logger.error(err);
    next(err);
  }
};
const getCarts = async (req, res, next) => {
  try {
    const result = await orderService.viewCart(req);
    return responseHelper.sendResponse(
      res,
      result.status,
      result.success,
      result.data,
      result.errors,
      result.message,
      result.token,
    );
  } catch (err) {
    logger.error(err);
    next(err);
  }
};

// admin
const getById = async (req, res, next) => {
  try {
    const result = await orderService.getById(req);
    return responseHelper.sendResponse(
      res,
      result.status,
      result.success,
      result.data,
      result.errors,
      result.message,
      result.token,
    );
  } catch (err) {
    logger.error(err);
    next(err);
  }
};
const list = async (req, res, next) => {
  try {
    const result = await orderService.list(req);
    return responseHelper.sendResponse(
      res,
      result.status,
      result.success,
      result.data,
      result.errors,
      result.message,
      result.token,
    );
  } catch (err) {
    logger.error(err);
    next(err);
  }
};
const updateStatus = async (req, res, next) => {
  try {
    const result = await orderService.updateStatus(req);
    return responseHelper.sendResponse(
      res,
      result.status,
      result.success,
      result.data,
      result.errors,
      result.message,
      result.token,
    );
  } catch (err) {
    logger.error(err);
    next(err);
  }
};

module.exports = {
  incrementCartItem,
  decrementCartItem,
  createOrder,
  paymentSuccess,
  getCarts,
  deleteCarts,
  paymentFailed,
  createCheckoutSession,

  //admin
  getById,
  list,
  updateStatus,
};
