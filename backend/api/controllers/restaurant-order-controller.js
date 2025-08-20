const restaurantOrderService = require("../services/restaurant-order-service");
const responseHelper = require("../../helpers/response-helper");
const logger = require("../../configs/logger");

const createOrder = async (req, res, next) => {
  try {
    const result = await restaurantOrderService.createOrder(req);
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

const addItemsToExistingOrder = async (req, res, next) => {
  try {
    const result = await restaurantOrderService.addItemsToExistingOrder(req);
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

const getTableActiveOrders = async (req, res, next) => {
  try {
    const result = await restaurantOrderService.getTableActiveOrders(req);
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

const closeTableSession = async (req, res, next) => {
  try {
    const result = await restaurantOrderService.closeTableSession(req);
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

// Admin controllers
const getOrderById = async (req, res, next) => {
  try {
    const result = await restaurantOrderService.getOrderById(req);
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

const listOrders = async (req, res, next) => {
  try {
    const result = await restaurantOrderService.listOrders(req);
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

const updateOrderStatus = async (req, res, next) => {
  try {
    const result = await restaurantOrderService.updateOrderStatus(req);
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

const updateOrderItemStatus = async (req, res, next) => {
  try {
    const result = await restaurantOrderService.updateOrderItemStatus(req);
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
  // Staff operations
  createOrder,
  addItemsToExistingOrder,
  getTableActiveOrders,
  closeTableSession,

  // Admin operations
  getOrderById,
  listOrders,
  updateOrderStatus,
  updateOrderItemStatus,
};
