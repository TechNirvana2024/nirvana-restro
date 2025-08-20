const httpStatus = require("http-status");
const responseHelper = require("./response-helper");
const validationHelper = {};
const internal = {};

internal.buildUsefulErrorObject = (errors) => {
  let sendObject = {};
  if (errors) {
    let errorProcess = errors.details ? errors.details : null;
    if (!errorProcess) {
      errorProcess = errors.detail ? errors.detail : null;
    }
    if (!errorProcess) {
      errorProcess = errors.length ? errors : null;
    }
    errorProcess.forEach((detail) => {
      let msg = `${detail.message.replace(/['"]/g, "")}`;
      if (detail.path.length > 1) {
        const keys = detail.path;
        let ref = sendObject;
        for (let i = 0; i < keys.length; i++) {
          let k = keys[i];
          if (!ref[k]) {
            if (keys[i + 1] > -1) {
              ref[k] = [];
            } else {
              ref[k] = {};
            }
          }
          if (Number(keys[i]).toString() != "NaN") {
            if (i === keys.length - 1) {
              ref[k].push(msg);
            } else {
              ref = ref[k];
            }
          } else {
            if (i === keys.length - 1) {
              ref[k] = msg;
            } else {
              ref = ref[k];
            }
          }
        }
      } else {
        sendObject[detail.path[0]] = msg;
      }
    });
  }
  return sendObject;
};

validationHelper.validateRequestBody = (req, res, validationModule, opt) => {
  try {
    const options = opt || {
      abortEarly: false,
    };
    const validation = validationModule.validate(req.body, options);
    if (validation.error) {
      const errors = validation.error
        ? internal.buildUsefulErrorObject(validation.error.details)
        : null;
      return errors;
    } else {
      return null;
    }
  } catch (err) {
    throw err;
  }
};

validationHelper.validateRequestParams = (req, res, validationModule, opt) => {
  const options = opt || {
    abortEarly: false,
  };
  const validation = validationModule.validate(req.params, options);
  if (validation.error) {
    const errors = validation.error
      ? internal.buildUsefulErrorObject(validation.error)
      : null;
    return errors;
  } else {
    return null;
  }
};

validationHelper.validateRequestQuery = (req, res, validationModule, opt) => {
  try {
    const options = {
      abortEarly: false,
    };
    const validation = validationModule.validate(req.query, options);
    if (validation.error) {
      const errors = validation.error
        ? internal.buildUsefulErrorObject(validation.error.details)
        : null;
      return errors;
    } else {
      return null;
    }
  } catch (err) {
    throw err;
  }
};

validationHelper.requireJsonData = (req, res, next) => {
  if (req.headers["content-type"] !== "application/json") {
    return responseHelper.sendResponse(
      res,
      httpStatus.BAD_REQUEST,
      false,
      null,
      `Server requires application/json got ${req.headers["content-type"]}`,
      "Bad Request.",
      null,
    );
  } else {
    return next();
  }
};

validationHelper.requireMultipartFormData = (req, res, next) => {
  if (!req.headers["content-type"].includes("multipart/form-data")) {
    return responseHelper.sendResponse(
      res,
      httpStatus.BAD_REQUEST,
      false,
      null,
      `Server requires multipart/form-data got ${req.headers["content-type"]}`,
      "Bad Request.",
      null,
    );
  } else {
    return next();
  }
};

validationHelper.requireJsonData = (req, res, next) => {
  if (req.headers["content-type"] !== "application/json") {
    return responseHelper.sendResponse(
      res,
      httpStatus.BAD_REQUEST,
      false,
      null,
      `Server requires application/json got ${req.headers["content-type"]}`,
      "Bad Request.",
      null,
    );
  } else {
    return next();
  }
};
validationHelper.requireMultipartFormData = (req, res, next) => {
  if (req.headers["content-type"].includes("multipart/form-data")) {
    return responseHelper.sendResponse(
      res,
      httpStatus.BAD_REQUEST,
      false,
      null,
      `Server requires multipart/form-data got ${req.headers["content-type"]}`,
      "Bad Request.",
      null,
    );
  } else {
    return next();
  }
};

module.exports = validationHelper;
