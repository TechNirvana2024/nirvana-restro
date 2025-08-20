const customerService = require("../services/customer-service");
const responseHelper = require("../../helpers/response-helper");
const logger = require("../../configs/logger");

// for customer
const register = async (req, res, next) => {
  try {
    const result = await customerService.register(req);
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
const verify = async (req, res, next) => {
  try {
    const result = await customerService.verifyEmail(req);
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
const regenerateToken = async (req, res, next) => {
  try {
    const result = await customerService.regenerateToken(req);
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
const generateFPToken = async (req, res, next) => {
  try {
    const result = await customerService.generateFPToken(req);
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
const verifyFPToken = async (req, res, next) => {
  try {
    const result = await customerService.verifyFPToken(req);
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
const createGuestAcc = async (req, res, next) => {
  try {
    const result = await customerService.createGuestAcc(req);
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

const updateGuestAcc = async (req, res, next) => {
  try {
    const result = await customerService.updateGuestAcc(req);
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

const forgetPassword = async (req, res, next) => {
  try {
    const result = await customerService.forgetPassword(req);
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
const login = async (req, res, next) => {
  try {
    const result = await customerService.login(req, res, next);
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

const loginUser = async (req, res, next) => {
  try {
    const result = await customerService.loginUser(req, res, next);
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

const oAuthLogin = async (req, res, next) => {
  try {
    const token = await customerService.oauthLogin(req, res, next);
    res.redirect(`https://staging.unimomo.co.uk/auth/callback?token=${token}`);
    // return responseHelper.sendResponse(
    //   res,
    //   result.status,
    //   result.success,
    //   result.data,
    //   result.errors,
    //   result.message,
    //   result.token,
    // );
  } catch (err) {
    logger.error(err);
    next(err);
  }
};
const update = async (req, res, next) => {
  try {
    const result = await customerService.updateCustomer(req, res, next);
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
const changePassword = async (req, res, next) => {
  try {
    const result = await customerService.changePassword(req, res, next);
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
const logout = async (req, res, next) => {
  try {
    const result = await customerService.logout(req, res);
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

const profile = async (req, res, next) => {
  try {
    const result = await customerService.profile(req);
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

const getOrders = async (req, res, next) => {
  try {
    const result = await customerService.orders(req);
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

// for admin
const resetPassword = async (req, res, next) => {
  try {
    const result = await customerService.resetPassword(req);
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
const getAllCustomer = async (req, res, next) => {
  try {
    const result = await customerService.getAllCustomer(req);
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
const getByIdCustomer = async (req, res, next) => {
  try {
    const result = await customerService.getByIdCustomer(req);
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
const updateByAdmin = async (req, res, next) => {
  try {
    const result = await customerService.updateByAdmin(req);
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
const block = async (req, res, next) => {
  try {
    const result = await customerService.block(req);
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
const archive = async (req, res, next) => {
  try {
    const result = await customerService.archive(req);
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
const generateLoyaltyPoint = async (req, res, next) => {
  try {
    const result = await customerService.generateLoyaltyPoint(req);
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
  register,
  verify,
  regenerateToken,
  profile,
  getOrders,
  login,
  oAuthLogin,
  changePassword,
  logout,
  update,
  generateFPToken,
  verifyFPToken,
  forgetPassword,
  loginUser,
  createGuestAcc,
  updateGuestAcc,
  // loyalty
  generateLoyaltyPoint,
  // admin
  getByIdCustomer,
  updateByAdmin,
  block,
  archive,
  resetPassword,
  getAllCustomer,
};
