const {
  customerModel,
  orderModel,
  orderItemModel,
  productModel,
  productMediaModel,
} = require("../../models");
const redis = require("../../configs/redis");
const crypto = require("crypto");
const generalConstant = require("../../constants/general-constant");
const { hashPassword, comparePasswords } = require("../../utils/bcrypt");
const paginate = require("../../utils/paginate");
const { generateOTPForUser, verifyOTPForUser } = require("../../utils/otp");
const { sendMail } = require("../../utils/mailer");
const { customerLoginHelper } = require("../../helpers/customer-login-helper");
const { generateCustomerJWT } = require("../../helpers/jwt-helper");
const { pointCalculator } = require("../../helpers/loyalty/generate-random");
const { Op, or } = require("sequelize");
const { endOfDay, startOfDay } = require("date-fns");

const register = async (req) => {
  const { password, ...rest } = req.body;
  rest.password = await hashPassword(password);
  const isCustomer = await customerModel.findOne({
    where: { email: rest.email },
  });

  if (
    isCustomer &&
    isCustomer.isEmailVerified === true &&
    isCustomer.isActive === true
  ) {
    return {
      ...generalConstant.EN.CUSTOMER.USER_ALREADY_EXISTS,
      data: null,
    };
  }
  if (
    isCustomer &&
    isCustomer.isEmailVerified === false &&
    isCustomer.isActive === false
  ) {
    await isCustomer.destroy();
  }

  const { otp, otpSecret } = await generateOTPForUser();
  rest.otpSecret = otpSecret;
  rest.gender = "other";
  const result = await customerModel.create(rest);
  const placeholders = {
    name: result.username,
    email: result.email,
    otp: otp,
  };

  sendMail("registrationOtp", placeholders, result.email).catch((error) => {
    // Log the error without throwing it further
    console.error("Mail sending error:", error);
  });
  if (!result) {
    return {
      ...generalConstant.EN.CUSTOMER.REGISTER_USER_FAILED,
      data: null,
    };
  }
  return {
    ...generalConstant.EN.CUSTOMER.REGISTER_USER_SUCCESS,
    data: result,
  };
};

// ---Verify email && Token---
const verifyEmail = async (req) => {
  const { email, otp } = req.body;
  try {
    const auth = await customerModel.findOne({ where: { email } });
    if (!auth) {
      return {
        ...generalConstant.EN.CUSTOMER.USER_NOT_FOUND,
        data: null,
      };
    }
    if (!auth.otpSecret) {
      return {
        ...generalConstant.EN.CUSTOMER.OTP_SECRET_NOT_FOUND,
        data: null,
      };
    }

    // Check if token is valid
    const isValidToken = await verifyOTPForUser(otp, auth.otpSecret);
    if (!isValidToken) {
      return {
        ...generalConstant.EN.CUSTOMER.OTP_EXPIRE,
        data: null,
      };
    }

    await auth.update({
      isEmailVerified: true,
      isActive: true,
      otpSecret: null,
    });

    const token = await customerLoginHelper(auth);

    return {
      ...generalConstant.EN.CUSTOMER.USER_VERIFY_SUCCESS,
      data: {
        id: auth.id,
        username: auth.username,
        email: auth.email,
        token,
      },
    };
  } catch (error) {
    throw error;
  }
};

// ---Regenerate Token---
const regenerateToken = async (req) => {
  try {
    const email = req.body.email;
    const auth = await customerModel.findOne({ where: { email } });
    if (!auth) {
      return {
        ...generalConstant.EN.CUSTOMER.USER_NOT_FOUND,
        data: null,
      };
    }
    const { otp, otpSecret } = await generateOTPForUser();

    await auth.update({ otpSecret });
    const placeholders = {
      name: auth.username,
      email: auth.email,
      otp,
    };
    sendMail("regenerateOtp", placeholders, auth.email).catch((error) => {
      // Log the error without throwing it further
      console.error("Mail sending error:", error);
    });

    return {
      ...generalConstant.EN.CUSTOMER.OTP_REGENERATE_SUCCESS,
      data: null,
    };
  } catch (error) {
    throw error;
  }
};
const generateFPToken = async (req) => {
  try {
    const email = req.body.email;
    const customer = await customerModel.findOne({
      where: { email, isActive: true, isEmailVerified: true, isDeleted: false },
    });
    if (customer.password === null) {
      return {
        ...generalConstant.EN.CUSTOMER.CANNOT_CHANGE_PASSWORD,
        data: null,
      };
    }
    if (!customer) {
      return {
        ...generalConstant.EN.CUSTOMER.USER_NOT_FOUND,
        data: null,
      };
    }

    const { otp, otpSecret } = await generateOTPForUser();
    await customer.update({
      otpSecret,
    });
    const placeholders = {
      name: customer.username,
      email: customer.email,
      otp,
    };
    sendMail("generateFPOtp", placeholders, customer.email).catch((error) => {
      // Log the error without throwing it further
      console.error("Mail sending error:", error);
    });
    return {
      ...generalConstant.EN.CUSTOMER.PASSWORD_RESET_TOKEN_SUCCESS,
      data: null,
    };
  } catch (error) {
    throw error;
  }
};

const verifyFPToken = async (req) => {
  try {
    const { email, otp } = req.body;

    const customer = await customerModel.findOne({ where: { email } });
    if (!customer) {
      return {
        ...generalConstant.EN.CUSTOMER.USER_NOT_FOUND,
        data: null,
      };
    }
    if (!customer.otpSecret) {
      return {
        ...generalConstant.EN.CUSTOMER.OTP_SECRET_NOT_FOUND,
        data: null,
      };
    }
    const isValidToken = await verifyOTPForUser(otp, customer?.otpSecret);
    if (!isValidToken) {
      return {
        ...generalConstant.EN.CUSTOMER.OTP_EXPIRE,
        data: null,
      };
    }
    const token = crypto.randomBytes(32).toString("hex");
    await customer.update({
      otpSecret: null,
      resetToken: token,
      resetTokenExpiry: Date.now() + 15 * 60 * 1000,
    });
    return {
      ...generalConstant.EN.CUSTOMER.VERIFY_TOKEN_SUCCESS,
      data: { token },
    };
  } catch (error) {
    throw error;
  }
};

const createGuestAcc = async (req) => {
  try {
    const data = {
      isGuest: true,
      username: `guest_${Date.now()}`,
    };

    const result = await customerModel.create(data);
    if (!result) {
      return {
        ...generalConstant.EN.CUSTOMER.GUEST_ACC_NOT_CREATED,
        data: null,
      };
    }
    const token = await customerLoginHelper(result);

    return {
      ...generalConstant.EN.CUSTOMER.CREATE_GUEST_SUCCESS,
      data: {
        id: result.id,
        username: "guest",
        email: result?.email,
        token,
      },
    };
  } catch (error) {
    throw error;
  }
};

const updateGuestAcc = async (req) => {
  try {
    const isGuest = await customerModel.findByPk(req.params.id);
    if (!isGuest) {
      return {
        ...generalConstant.EN.CUSTOMER.GUEST_ACCOUNT_NOT_FOUND,
        data: null,
      };
    }

    const updated = await isGuest.update(req.body);
    if (!updated) {
      return {
        ...generalConstant.EN.CUSTOMER.UPDATE_USER_FAILURE,
        data: null,
      };
    }
    return {
      ...generalConstant.EN.CUSTOMER.UPDATE_USER_SUCCESS,
      data: null,
    };
  } catch (error) {
    throw error;
  }
};

// ---Forget Password---

const forgetPassword = async (req) => {
  try {
    const { email, password, token } = req.body;

    const customer = await customerModel.findOne({
      where: { email },
    });
    if (!customer) {
      return {
        ...generalConstant.EN.CUSTOMER.USER_NOT_FOUND,
        data: null,
      };
    }

    if (token !== customer.resetToken) {
      await customer.update({
        resetToken: null,
        resetTokenExpiry: null,
      });
      return {
        ...generalConstant.EN.CUSTOMER.TOKEN_MISMATCHED,
        data: null,
      };
    }
    if (Date.now() > customer.resetTokenExpiry) {
      await customer.update({
        resetToken: null,
        resetTokenExpiry: null,
      });

      return {
        ...generalConstant.EN.CUSTOMER.TOKEN_EXPIRED,
        data: null,
      };
    }

    const hashedPassword = await hashPassword(password);
    await customer.update({
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null,
    });

    return {
      ...generalConstant.EN.CUSTOMER.PASSWORD_RESET_SUCCESS,
      data: null,
    };
  } catch (error) {
    throw error;
  }
};

const login = async (req) => {
  try {
    const userId = req.session?.passport?.user;

    if (!userId) {
      return {
        ...generalConstant.EN.CUSTOMER.UNAUTHORIZED_USER,
        data: null,
      };
    }
    const user = await customerModel.findByPk(userId);
    if (!user) {
      return {
        ...generalConstant.EN.CUSTOMER.USER_NOT_FOUND,
        data: null,
      };
    }
    const token = await customerLoginHelper(user);
    return {
      ...generalConstant.EN.CUSTOMER.LOGIN_SUCCESS,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        isGuest: user.isGuest,
        token,
      },
    };
  } catch (error) {
    throw error;
  }
};

const oauthLogin = async (req) => {
  try {
    const userId = req.session?.passport?.user;
    if (!userId) {
      return {
        ...generalConstant.EN.CUSTOMER.UNAUTHORIZED_USER,
        data: null,
      };
    }
    const user = await customerModel.findByPk(userId);
    if (!user) {
      return {
        ...generalConstant.EN.CUSTOMER.USER_NOT_FOUND,
        data: null,
      };
    }
    const token = await customerLoginHelper(user);
    // res.redirect(`http://localhost:8080/auth/popup?token=${token}`);
    return token;
    // return {
    //   ...generalConstant.EN.CUSTOMER.LOGIN_SUCCESS,
    //   data: {
    //     id: user.id,
    //     username: user.username,
    //     email: user.email,
    //     token,
    //   },
    // };
  } catch (error) {
    throw error;
  }
};

const updateCustomer = async (req) => {
  try {
    const isCustomer = await customerModel.findByPk(req.user.id);

    if (!isCustomer) {
      return {
        ...generalConstant.EN.CUSTOMER.USER_NOT_FOUND,
        data: null,
      };
    }
    await isCustomer.update({
      ...req.body,
    });

    return {
      ...generalConstant.EN.CUSTOMER.UPDATE_USER_SUCCESS,
      data: isCustomer,
    };
  } catch (error) {
    throw error;
  }
};

const logout = async (req) => {
  try {
    const del = await redis.del(`auth:${req.user.id}`);
    if (!del) {
      return {
        ...generalConstant.EN.CUSTOMER.CLEAR_REDIS_FAILURE,
        data: isCustomer,
      };
    }

    return {
      ...generalConstant.EN.CUSTOMER.LOGOUT_SUCCESS,
      data: null,
    };
  } catch (error) {
    throw error;
  }
};

const profile = async (req) => {
  try {
    const result = await customerModel.findOne({
      where: { id: req.user.id },
      include: [
        {
          model: orderModel,
          as: "orders",
          include: [
            {
              model: orderItemModel,
              as: "orderItems",
              include: [
                {
                  model: productModel,
                  as: "product",
                  include: [{ model: productMediaModel, as: "mediaArr" }],
                },
              ],
            },
          ],
        },
      ],
    });

    return result
      ? {
          ...generalConstant.EN.CUSTOMER.USER_FOUND,
          data: result,
        }
      : {
          ...generalConstant.EN.CUSTOMER.USER_FETCH_FAILURE,
          data: null,
        };
  } catch (error) {
    throw error;
  }
};

const orders = async (req) => {
  try {
    const userId = req.user.id;

    let {
      limit,
      page,
      status,
      paymentStatus,
      paymentMethod,
      trackingNo,
      email,
      sort,
      start,
      end,
    } = req.query;

    const filters = { customerId: userId };
    const include = [
      {
        model: orderItemModel,
        as: "orderItems",
        include: [
          {
            model: productModel,
            as: "product",
            include: [{ model: productMediaModel, as: "mediaArr" }],
          },
        ],
      },
    ];
    const order = [];

    if (trackingNo) filters.trackingNo = { [Op.like]: `%${trackingNo}%` };

    if (start && end) {
      if (new Date(start) > new Date(end)) {
        return {
          status: 400,
          data: null,
          message: "minDuration cannot be greater than maxDuration",
        };
      }

      filters.orderDate = {
        [Op.between]: [startOfDay(start), endOfDay(end)],
      };
    }
    if (sort) {
      if (sort === "priceDesc") order.push(["totalAmount", "DESC"]);
      else if (sort === "priceAsc") order.push(["totalAmount", "ASC"]);
      else if (sort === "oldest") order.push(["createdAt", "ASC"]);
      else if (sort === "latest") order.push(["createdAt", "DESC"]);
    }

    let result = await paginate(orderModel, {
      limit,
      page,
      filters,
      include,
      order,
    });

    if (!result) {
      return {
        ...generalConstant.EN.CUSTOMER.ORDER_LIST_FAILURE,
        data: null,
      };
    }
    return {
      ...generalConstant.EN.CUSTOMER.ORDER_LIST_SUCCESS,
      data: result,
    };
  } catch (error) {
    throw error;
  }
};

const changePassword = async (req) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const customer = await customerModel.findByPk(req.user.id);
    if (!customer) {
      return {
        ...generalConstant.EN.CUSTOMER.USER_NOT_FOUND,
        data: null,
      };
    }
    const isValid = await comparePasswords(oldPassword, customer.password);
    if (!isValid) {
      return {
        ...generalConstant.EN.CUSTOMER.INCORRECT_PASSWORD,
        data: null,
      };
    }

    const hashedPassword = await hashPassword(newPassword);
    await customer.update({ password: hashedPassword });

    return {
      ...generalConstant.EN.CUSTOMER.PASSWORD_CHANGE_SUCCESS,
      data: null,
    };
  } catch (error) {
    throw error;
  }
};

const generateLoyaltyPoint = async (req) => {
  try {
    const id = req.user.id;
    const orderId = req.body.orderId;

    const customer = await customerModel.findByPk(id);
    if (!customer) {
      return {
        status: 404,
        success: false,
        message: `Customer not found.`,
      };
    }

    if (customer.isGuest) {
      return {
        status: 400,
        success: false,
        message: `Guest users are not allowed to earn loyalty points.`,
      };
    }

    const order = await orderModel.findByPk(orderId);
    if (!order || order.customerId !== id) {
      return {
        status: 400,
        success: false,
        message: `Order not found or does not belong to the user.`,
      };
    }

    if (order.isLoyaltyIssued) {
      return {
        status: 400,
        success: false,
        message: `Loyalty points already issued for this order.`,
      };
    }

    const orderCreatedTime = new Date(order.createdAt).getTime();
    const now = Date.now();
    const hoursLimit = 1 * 60 * 60 * 1000;

    if (now - orderCreatedTime > hoursLimit) {
      return {
        status: 400,
        success: false,
        message: `Loyalty redeem time expired.`,
      };
    }

    if (order.paymentMethod !== "stripe") {
      return {
        status: 400,
        success: false,
        message: `Only Stripe payments are eligible.`,
      };
    }

    if (order.paymentStatus !== "complete") {
      return {
        status: 400,
        success: false,
        message: `Only completed payments are eligible.`,
      };
    }

    const { updatedPoint, newPoint } = pointCalculator(customer.loyaltyPoints);
    await Promise.all([
      customer.update({ loyaltyPoints: updatedPoint }),
      order.update({ isLoyaltyIssued: true }),
    ]);

    const calIndex = newPoint / 100;
    return {
      data: { index: calIndex },
      status: 200,
      success: true,
      message: `Loyalty points generated successfully.`,
    };
  } catch (error) {
    console.error("Error generating loyalty points:", error);
    throw error;
  }
};

// api for admin

const resetPassword = async (req) => {
  try {
    const customer = await customerModel.findByPk(req.params.id);
    if (!customer) {
      return {
        ...generalConstant.EN.CUSTOMER.USER_NOT_FOUND,
        data: null,
      };
    }
    const hashedPassword = await hashPassword(req.body.password);
    await customer.update({ password: hashedPassword });
    return {
      ...generalConstant.EN.CUSTOMER.PASSWORD_RESET_SUCCESS,
      data: null,
    };
  } catch (error) {
    throw error;
  }
};
const getAllCustomer = async (req) => {
  try {
    let {
      limit,
      page,
      username,
      userType,
      date,
      isEmailVerified,
      email,
      createdAt,
    } = req.query;
    const filters = {};
    const include = [];

    if (userType === "guest") {
      filters.isGuest = {
        [Op.eq]: true,
      };
    } else {
      filters.isGuest = {
        [Op.eq]: false,
      };
    }
    if (username) {
      filters.username = {
        [Op.like]: `%${username}%`,
      };
    }
    if (email) {
      filters.email = {
        [Op.like]: `%${email}%`,
      };
    }
    if (createdAt) {
      const date = new Date(createdAt);
      if (!isNaN(date.getTime())) {
        // Validate date
        const startOfDay = new Date(date.setHours(0, 0, 0, 0)); // Start of day
        const endOfDay = new Date(date.setHours(23, 59, 59, 999)); // End of day

        filters.createdAt = {
          [Op.between]: [startOfDay, endOfDay],
        };
      } else {
        console.warn("Invalid createdAt date");
      }
    }

    if (isEmailVerified) {
      filters.isEmailVerified = {
        [Op.like]: `%${isEmailVerified}%`,
      };
    }
    const startOfDay = new Date(date);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 999);
    if (date) {
      filters.createdAt = {
        [Op.between]: [startOfDay, endOfDay],
      };
    }

    const result = await paginate(customerModel, {
      limit,
      page,
      filters,
      include,
    });

    if (!result) {
      return {
        ...generalConstant.EN.CUSTOMER.USER_LIST_FAILURE,
        data: null,
      };
    }
    return {
      ...generalConstant.EN.CUSTOMER.USER_LIST_SUCCESS,
      data: result,
    };
  } catch (error) {
    throw error;
  }
};
const getByIdCustomer = async (req) => {
  try {
    const result = await customerModel.findOne({
      where: { id: req.params.id },
      include: [
        {
          model: orderModel,
          as: "orders",
        },
      ],
    });

    return result
      ? {
          ...generalConstant.EN.CUSTOMER.USER_FOUND,
          data: result,
        }
      : {
          ...generalConstant.EN.CUSTOMER.USER_NOT_FOUND,
          data: null,
        };
  } catch (error) {
    throw error;
  }
};
const updateByAdmin = async (req) => {
  try {
    const isCustomer = await customerModel.findByPk(req.params.id);

    if (!isCustomer) {
      return {
        ...generalConstant.EN.CUSTOMER.USER_NOT_FOUND,
        data: null,
      };
    }

    await isCustomer.update({
      ...req.body,
    });

    return {
      ...generalConstant.EN.CUSTOMER.UPDATE_USER_SUCCESS,
      data: isCustomer,
    };
  } catch (error) {
    throw error;
  }
};
const block = async (req) => {
  try {
    const isCustomer = await customerModel.findByPk(req.params.id);

    if (!isCustomer) {
      return {
        ...generalConstant.EN.CUSTOMER.USER_NOT_FOUND,
        data: null,
      };
    }
    isCustomer.isActive = !isCustomer.isActive;
    const result = await isCustomer.save();
    return {
      ...generalConstant.EN.CUSTOMER.USER_BLOCK_SUCCESS,
      message: `Customer ${result.isActive === true ? "unblock" : "block"} successfully`,
      data: null,
    };
  } catch (error) {
    throw error;
  }
};
const archive = async (req) => {
  try {
    const isCustomer = await customerModel.findByPk(+req.params.id);

    if (!isCustomer) {
      return {
        ...generalConstant.EN.CUSTOMER.USER_NOT_FOUND,
        data: null,
      };
    }
    isCustomer.isDeleted = !isCustomer.isDeleted;
    const result = await isCustomer.save();
    return {
      ...generalConstant.EN.CUSTOMER.USER_ARCHIVE_SUCCESS,
      message: `Customer ${result.isDeleted === true ? "archived" : "unArchived"} successfully`,
      data: null,
    };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  //customer
  register,
  verifyEmail,
  regenerateToken,
  profile,
  orders,
  logout,
  login,
  oauthLogin,
  updateCustomer,
  changePassword,
  generateFPToken,
  verifyFPToken,
  forgetPassword,
  updateGuestAcc,
  createGuestAcc,

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
