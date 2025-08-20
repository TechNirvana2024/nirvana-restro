// packages
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { Op } = require("sequelize");

// paths
const redis = require("../../configs/redis");
const {
  customerModel,
  orderModel,
  orderItemModel,
  productModel,
  cartModel,
  cartItemModel,
  productMediaModel,
  productCategoryModel,
} = require("../../models");

// helpers
const { getOrCreateCart } = require("../../helpers/order/get-or-create-cart");
const {
  releaseExpiredStock,
} = require("../../helpers/order/release-expired-stock");
const { withTransaction } = require("../../helpers/order/transaction");
const { withLock } = require("../../helpers/order/red-lock");

//constant
const { RESERVATION_TTL } = require("../../constants/time-constant");
const paginate = require("../../utils/paginate");
const { isInRedeem } = require("../../helpers/loyalty/is-in-redeem");
const { deliveryCharge } = require("../../helpers/order/delivery-fee");
const {
  calculateServiceCharge,
} = require("../../helpers/order/service-charge");
const { sendMail } = require("../../utils/mailer");

// customer services
const incrementCartItem = async (req) => {
  const userId = +req.user.id;

  const { productId, quantity } = req.body;
  const productKey = `product:${productId}:reserved`;
  const lockKey = `lock:product:${productId}`;

  return withLock(lockKey, () =>
    withTransaction(async (t) => {
      await releaseExpiredStock(t);
      const product = await productModel.findByPk(productId, {
        lock: t.LOCK.UPDATE,
        transaction: t,
      });
      if (!product) {
        return { status: 404, success: false, message: "Product not found" };
      }

      const available = product.quantity - product.reservedQuantity;
      if (available < quantity) {
        return {
          status: 400,
          success: false,
          message: `Insufficient stock. Available: ${available}, Requested: ${quantity}`,
        };
      }

      const cart = await getOrCreateCart(userId, t);
      const existingItem = await cartItemModel.findOne({
        where: { cartId: cart.id, productId },
        transaction: t,
      });

      const newQuantity = existingItem
        ? existingItem.quantity + quantity
        : quantity;
      const quantityChange = existingItem ? quantity : quantity;
      const newReserved = product.reservedQuantity + quantityChange;

      await redis.set(productKey, newReserved, "PX", RESERVATION_TTL);
      await product.update(
        { reservedQuantity: newReserved },
        { transaction: t },
      );

      if (existingItem) {
        await existingItem.update(
          { quantity: newQuantity },
          { transaction: t },
        );
      } else {
        await cartItemModel.create(
          { cartId: cart.id, productId, quantity: newQuantity },
          { transaction: t },
        );
      }

      await cart.update(
        { expiresAt: new Date(Date.now() + RESERVATION_TTL) },
        { transaction: t },
      );

      const updatedCart = await cartModel.findByPk(cart.id, {
        include: [{ model: cartItemModel, as: "items" }],
        transaction: t,
      });
      return {
        status: 200,
        success: true,
        message: "Item quantity incremented",
        data: updatedCart,
      };
    }),
  );
};

const decrementCartItem = async (req) => {
  const userId = +req.user.id;

  const { productId, quantity } = req.body;
  const productKey = `product:${productId}:reserved`;
  const lockKey = `lock:product:${productId}`;

  return withLock(lockKey, () =>
    withTransaction(async (t) => {
      await releaseExpiredStock(t);
      const product = await productModel.findByPk(productId, {
        lock: t.LOCK.UPDATE,
        transaction: t,
      });
      if (!product) {
        return { status: 404, success: false, message: "Product not found" };
      }

      const cart = await cartModel.findOne({
        where: { userId },
        transaction: t,
      });
      if (!cart) {
        return { status: 404, success: false, message: "Cart not found" };
      }

      const existingItem = await cartItemModel.findOne({
        where: { cartId: cart.id, productId },
        transaction: t,
      });
      if (!existingItem) {
        return {
          status: 400,
          success: false,
          message: "Item not found in cart",
        };
      }

      const newQuantity = existingItem.quantity - quantity;
      if (newQuantity < 0) {
        return {
          status: 400,
          success: false,
          message: "Quantity cannot be reduced below 0",
        };
      }

      const newReserved = Math.max(product.reservedQuantity - quantity, 0);

      if (newReserved > 0) {
        await redis.set(productKey, newReserved, "PX", RESERVATION_TTL);
      } else {
        await redis.del(productKey);
      }

      await product.update(
        { reservedQuantity: newReserved },
        { transaction: t },
      );

      if (newQuantity === 0) {
        await existingItem.destroy({ transaction: t });
      } else {
        await existingItem.update(
          { quantity: newQuantity },
          { transaction: t },
        );
      }

      const updatedCart = await cartModel.findByPk(cart.id, {
        include: [{ model: cartItemModel, as: "items" }],
        transaction: t,
      });
      return {
        status: 200,
        success: true,
        message: "Item quantity decremented",
        data: updatedCart,
      };
    }),
  );
};

const createOrder = async (req) => {
  const userId = +req.user.id;
  const { idempotencyKey, ...orderDetails } = req.body;

  const redisKey = `checkout:${orderDetails.stripePaymentIntentId}`;
  const redisDataRaw = await redis.get(redisKey);
  const redisData = redisDataRaw ? JSON.parse(redisDataRaw) : null;
  let order;

  let transactionResult = await withTransaction(async (t) => {
    // Check for idempotency
    const existingOrder = await orderModel.findOne({
      where: { idempotencyKey },
      transaction: t,
    });

    if (existingOrder) {
      order = existingOrder;
      return {
        status: 200,
        success: true,
        message: "Order already exists",
        data: existingOrder,
      };
    }

    await releaseExpiredStock(t);

    const cart = await cartModel.findOne({
      where: { userId },
      include: [
        {
          model: cartItemModel,
          as: "items",
          include: [{ model: productModel, as: "product" }],
        },
      ],
      transaction: t,
    });

    if (!cart || !cart.items.length) {
      return { status: 400, success: false, message: "Cart is empty" };
    }

    // Stock validation
    for (const item of cart.items) {
      const productKey = `product:${item.productId}:reserved`;
      const lockKey = `lock:product:${item.productId}`;

      const result = await withLock(lockKey, async () => {
        const product = await productModel.findByPk(item.productId, {
          lock: t.LOCK.UPDATE,
          transaction: t,
        });

        if (!product) {
          return {
            status: 404,
            success: false,
            message: `Product ${item.productId} not found`,
          };
        }

        const userReserved = item.quantity;
        const reservedByOthers = Math.max(
          product.reservedQuantity - userReserved,
          0,
        );
        const availableForUser = product.quantity - reservedByOthers;

        if (availableForUser < item.quantity) {
          return {
            status: 400,
            success: false,
            message: `Insufficient stock for product ${item.productId}. Available: ${availableForUser}, Requested: ${item.quantity}`,
          };
        }

        return null;
      });

      if (result) return result;
    }

    //Redeemed Map from Redis
    const redeemedMap = new Map();
    if (redisData?.redeemDetails?.length) {
      for (const redeem of redisData.redeemDetails) {
        redeemedMap.set(redeem.productId, redeem.quantity);
      }
    }

    //Prepare order items and totalAmount
    let orderItems = [];
    let totalAmount = 0;

    for (const item of cart.items) {
      const productPrice = +item.product.price;
      const quantity = item.quantity;
      const productId = item.productId;
      const redeemedQty = redeemedMap.get(productId) || 0;
      const redeemed = Math.min(redeemedQty, quantity);
      const fullSubtotal = productPrice * quantity;
      const discount = productPrice * redeemed;
      const subtotal = fullSubtotal - discount;

      totalAmount += subtotal;

      orderItems.push({
        orderId: 0, // temporary
        cartId: cart.id,
        productId,
        quantity,
        price: productPrice,
        discount,
        subtotal,
      });
    }

    order = await orderModel.create(
      {
        customerId: userId,
        address: orderDetails.address,
        paymentMethod: orderDetails.paymentMethod,
        totalAmount,
        status: "pending",
        stripePaymentIntentId: orderDetails.stripePaymentIntentId,
        idempotencyKey,
        orderNote: orderDetails.orderNote,
        deliveryTime: orderDetails.deliveryTime,
        deliveryType: redisData?.deliveryType,
        email: orderDetails.email,
        mobileNumber: orderDetails?.mobileNumber,
        city: orderDetails.city,
        pinCode: orderDetails.pinCode,
      },
      { transaction: t },
    );

    // Save order items
    orderItems = orderItems.map((item) => ({
      ...item,
      orderId: order.id,
    }));

    await orderItemModel.bulkCreate(orderItems, { transaction: t });

    // Clear cart
    await cartItemModel.destroy({ where: { cartId: cart.id }, transaction: t });
    await cart.destroy({ transaction: t });
  });

  if (transactionResult) return transactionResult;

  // Handle cash payment
  const paymentMethod = "cash";
  if (order && order.paymentMethod === paymentMethod) {
    const paymentResult = await paymentSuccess(paymentMethod, { id: order.id });
    if (!paymentResult.success) {
      await orderModel.update(
        { status: "cancelled", paymentStatus: "failed" },
        { where: { id: order.id } },
      );
      return paymentResult;
    }
    order = paymentResult.data;
  }

  return {
    status: 200,
    success: true,
    message: "Order created successfully",
    data: order,
  };
};

const viewCart = async (req) => {
  const userId = +req.user.id;
  try {
    const cart = await cartModel.findOne({
      where: { userId },
      include: [
        {
          model: cartItemModel,
          as: "items",
          include: [
            {
              model: productModel,
              as: "product",
              include: [
                { model: productMediaModel, as: "mediaArr" },
                {
                  model: productCategoryModel,
                  as: "product_category",
                  attributes: ["loyaltyRequired"],
                },
              ],
            },
          ],
        },
      ],
    });

    if (!cart) {
      return {
        status: 200,
        success: true,
        message: "Carts is Empty!",
      };
    }

    const now = new Date();
    const isCartActive = cart.expiresAt && cart.expiresAt > now;

    const itemsWithAvailability = await Promise.all(
      cart.items.map(async (item) => {
        const availableKey = `product:${item.productId}:available`;
        let available = await redis.get(availableKey);

        if (!available) {
          // Calculate total reserved by others (excluding this user's reservation)
          const activeCarts = await cartModel.findAll({
            where: {
              expiresAt: { [Op.gt]: now },
              userId: { [Op.ne]: userId }, // Exclude current user
            },
            include: [
              {
                model: cartItemModel,
                as: "items",
                where: { productId: item.productId },
              },
            ],
          });

          let reservedByOthers = 0;
          for (const activeCart of activeCarts) {
            for (const cartItem of activeCart.items) {
              reservedByOthers += cartItem.quantity;
            }
          }

          // Total sold from confirmed orders
          const soldItems = await orderItemModel.findAll({
            where: { productId: item.productId },
            include: [
              {
                model: orderModel,
                as: "order",
                where: { status: "confirmed" },
              },
            ],
          });
          const totalSold = soldItems.reduce(
            (sum, soldItem) => sum + soldItem.quantity,
            0,
          );

          available = item.product.quantity - totalSold - reservedByOthers;
          await redis.set(availableKey, available, "EX", 60); // Cache for 60 seconds
        }

        available = parseInt(available, 10);

        // Adjust availability for the current user if their cart is active
        let effectiveAvailable = available;
        if (isCartActive) {
          effectiveAvailable += item.quantity; // Include user's own reservation
        }

        return {
          id: item.id,
          productId: item.productId,
          quantity: item.quantity,
          name: item.product.name,
          reedemPoints: item.product.product_category.loyaltyRequired,
          description: item.product.description,
          image: item.product.mediaArr[0]?.imageUrl,
          price: item.product.price,
          available: Math.max(effectiveAvailable, 0),
          status:
            effectiveAvailable >= item.quantity
              ? "available"
              : effectiveAvailable > 0
                ? "partially_available"
                : "out_of_stock",
        };
      }),
    );

    return {
      status: 200,
      success: true,
      message: "Cart retrieved successfully",
      data: {
        cartId: cart.id,
        expiresAt: cart.expiresAt,
        items: itemsWithAvailability,
      },
    };
  } catch (e) {
    console.error("View cart error:", e);
    return {
      status: 500,
      success: false,
      message: "Internal server error",
      error: e.message,
    };
  }
};

const removeCartItems = async (req) => {
  const userId = +req.user.id;
  const { cartItemIds } = req.body;

  return withTransaction(async (t) => {
    const cart = await cartModel.findOne({
      where: { userId },
      include: [{ model: cartItemModel, as: "items" }],
      transaction: t,
    });
    if (!cart) {
      return { status: 404, success: false, message: "Cart not found" };
    }

    // Filter cart items to only those requested for removal and belonging to this cart
    const itemsToRemove = cart.items.filter((item) =>
      cartItemIds.includes(item.id),
    );
    if (itemsToRemove.length === 0) {
      return {
        status: 400,
        success: false,
        message: "No valid cart item IDs found in the user's cart",
      };
    }

    // Process each item to release reserved stock and delete
    for (const item of itemsToRemove) {
      const lockKey = `lock:product:${item.productId}`;
      const productKey = `product:${item.productId}:reserved`;

      await withLock(lockKey, async () => {
        const product = await productModel.findByPk(item.productId, {
          lock: t.LOCK.UPDATE,
          transaction: t,
        });
        if (!product) {
          // Log error but continue (item will still be deleted)
          console.error(
            `Product ${item.productId} not found for cart item ${item.id}`,
          );
        } else {
          // Release reserved quantity
          const newReserved = Math.max(
            product.reservedQuantity - item.quantity,
            0,
          );
          const stockStatus =
            product.quantity === 0
              ? "out_of_stock"
              : product.quantity < 5
                ? "low_stock"
                : "in_stock";

          await product.update(
            { reservedQuantity: newReserved, stockStatus },
            { transaction: t },
          );

          // Update or remove Redis reservation key
          if (newReserved > 0) {
            await redis.set(productKey, newReserved, "PX", RESERVATION_TTL);
          } else {
            await redis.del(productKey);
          }
        }

        await cartItemModel.destroy({
          where: { id: item.id },
          transaction: t,
        });
      });
    }

    // If no items remain in the cart, delete the cart
    const remainingItems = await cartItemModel.count({
      where: { cartId: cart.id },
      transaction: t,
    });
    if (remainingItems === 0) {
      await cart.destroy({ transaction: t });
      return {
        status: 200,
        success: true,
        message: "Cart items removed and cart deleted",
        data: null,
      };
    }

    // Fetch updated cart
    const updatedCart = await cartModel.findByPk(cart.id, {
      include: [{ model: cartItemModel, as: "items" }],
      transaction: t,
    });

    return {
      status: 200,
      success: true,
      message: "Cart items removed successfully",
      data: updatedCart,
    };
  });
};

const paymentSuccess = async (paymentMethod, payload) => {
  const { id } = payload;
  if (!id) {
    return {
      status: 400,
      success: false,
      message: "Order ID is required",
    };
  }

  return await withTransaction(async (t) => {
    let order;

    if (paymentMethod === "stripe") {
      order = await orderModel.findOne({
        where: {
          stripePaymentIntentId: id,
        },
        include: [
          {
            model: orderItemModel,
            as: "orderItems",
          },
          {
            model: customerModel,
            as: "customer",
          },
        ],
        transaction: t,
      });
    } else {
      order = await orderModel.findOne({
        where: { id },
        include: [
          {
            model: orderItemModel,
            as: "orderItems",
          },
          {
            model: customerModel,
            as: "customer",
          },
        ],
        transaction: t,
      });
    }

    if (!order) {
      return {
        status: 404,
        success: false,
        message: "Order not found",
      };
    }

    if (order.status === "complete") {
      return {
        status: 200,
        success: true,
        message: "Payment already processed",
        data: order,
      };
    }

    const customer = await customerModel.findByPk(order.customerId, {
      transaction: t,
    });
    if (!customer) {
      return {
        status: 404,
        success: false,
        message: "Customer not found",
      };
    }

    //Deduct loyalty tokens used in redemption from Redis
    if (paymentMethod === "stripe") {
      const redisKey = `checkout:${order.stripePaymentIntentId}`;
      const redisData = await redis.get(redisKey);
      if (redisData) {
        const { loyaltyDeducted } = JSON.parse(redisData);
        const tokens = parseInt(loyaltyDeducted || "0", 10);
        if (!customer.isGuest && tokens > 0) {
          if (customer.loyaltyPoints < tokens) {
            throw new Error("User has insufficient loyalty points to deduct.");
          }

          await customer.update(
            { loyaltyPoints: customer.loyaltyPoints - tokens },
            { transaction: t },
          );
        }
        await redis.del(redisKey);
      }
    }
    // Add loyalty points only if user is not a guest
    if (!customer.isGuest && paymentMethod === "stripe") {
      const earnedPoints = Math.floor(order.totalAmount * 100); // 1 USD = 100 loyalty points
      await customer.update(
        { loyaltyPoints: customer.loyaltyPoints + earnedPoints },
        { transaction: t },
      );
    }

    // product deduct process

    for (const item of order.orderItems) {
      const lockKey = `lock:product:${item.productId}`;
      await withLock(lockKey, async () => {
        const product = await productModel.findByPk(item.productId, {
          lock: t.LOCK.UPDATE,
          transaction: t,
        });
        if (!product) {
          return {
            status: 404,
            success: false,
            message: `Product ${item.productId} not found`,
          };
        }

        const newQuantity = product.quantity - item.quantity;
        const newReservedQuantity = product.reservedQuantity - item.quantity;
        if (newQuantity < 0) {
          return {
            status: 400,
            success: false,
            message: `Insufficient stock to confirm order for product ${item.productId}`,
          };
        }

        const stockStatus =
          newQuantity === 0
            ? "out_of_stock"
            : newQuantity < 5
              ? "low_stock"
              : "in_stock";

        await product.update(
          {
            quantity: newQuantity,
            stockStatus,
            reservedQuantity: newReservedQuantity,
          },
          { transaction: t },
        );
        await redis.del(`product:${item.productId}:reserved`);
      });
    }

    // ====================

    await order.update(
      {
        status: "confirmed",
        paymentStatus: "complete",
      },
      { transaction: t },
    );

    // const mail = customer.isGuest ? customer.guest_email : customer.email;
    const placeholders = {
      name: order.customer.username,
      email: order.email,
      orderStatus: "confirmed",
      paymentStatus: "complete",
      trackingNo: order.trackingNo,
    };
    sendMail("paymentSuccess", placeholders, order.email).catch((error) => {
      // Log the error without throwing it further
      console.error("Mail sending error:", error);
    });

    return {
      status: 200,
      success: true,
      message: "Payment success and order updated",
      data: order,
    };
  });
};

const paymentFailed = async (payload) => {
  const { id } = payload;
  if (!id) {
    return { status: 400, success: false, message: "Order ID is required" };
  }

  return withTransaction(async (t) => {
    const order = await orderModel.findOne({
      where: {
        stripePaymentIntentId: id,
      },
      include: [
        {
          model: orderItemModel,
          as: "orderItems",
        },
        {
          model: customerModel,
          as: "customer",
        },
      ],
      transaction: t,
    });

    if (order.paymentStatus === "complete" || order.status === "confirmed") {
      return {
        status: 400,
        success: false,
        message: "Order is already paid and confirmed",
      };
    }
    if (order.paymentStatus === "failed" || order.status === "cancelled") {
      return {
        status: 400,
        success: false,
        message: "Order payment has already failed",
      };
    }

    for (const item of order.orderItems) {
      const lockKey = `lock:product:${item.productId}`;
      const productKey = `product:${item.productId}:reserved`;

      await withLock(lockKey, async () => {
        const product = await productModel.findByPk(item.productId, {
          lock: t.LOCK.UPDATE,
          transaction: t,
        });
        if (!product) {
          return {
            status: 404,
            success: false,
            message: `Product ${item.productId} not found`,
          };
        }

        // Release the reserved quantity back to available stock
        const newReserved = Math.max(
          product.reservedQuantity - item.quantity,
          0,
        );
        const stockStatus =
          product.quantity === 0
            ? "out_of_stock"
            : product.quantity < 5
              ? "low_stock"
              : "in_stock";

        await product.update(
          { reservedQuantity: newReserved, stockStatus },
          { transaction: t },
        );

        // Update or remove Redis reservation key
        if (newReserved > 0) {
          await redis.set(productKey, newReserved, "PX", RESERVATION_TTL);
        } else {
          await redis.del(productKey);
        }
      });
    }

    await order.update(
      { paymentStatus: "failed", status: "cancelled" },
      { transaction: t },
    );

    const placeholders = {
      name: order.customer.username,
      email: order.email,
      orderStatus: "cancelled",
      paymentStatus: "cancelled",
      trackingNo: order.trackingNo,
    };

    sendMail("paymentFailed", placeholders, order.email).catch((error) => {
      // Log the error without throwing it further
      console.error("Mail sending error:", error);
    });

    // mailing

    return {
      status: 200,
      success: true,
      message: "Payment failed, order updated and stock released",
      data: order,
    };
  });
};

const createCheckoutSession = async (req) => {
  try {
    const userId = req?.user?.id;
    const redeemItems = req.body.redeemItems || [];
    const deliveryType = req.body.deliveryType;
    const redeemMap = Object.fromEntries(
      redeemItems.map((item) => [item.productId, item.quantity]),
    );

    const user = await customerModel.findByPk(userId);
    if (user.isGuest && req.body?.redeemItems?.length) {
      return {
        status: 400,
        success: false,
        message: "Only registered users can redeem items.",
        data: null,
      };
    }

    const cart = await cartModel.findOne({
      where: { userId },
      include: {
        model: cartItemModel,
        as: "items",
        include: {
          model: productModel,
          as: "product",
          include: {
            model: productCategoryModel,
            as: "product_category",
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return {
        status: 404,
        success: false,
        message: "Cart is empty or not found.",
        data: null,
      };
    }

    const BAG_FEE = 0.1 * 100;

    let totalTokensRequired = 0;
    let totalPaidAmount = 0;
    const line_items = [];
    const redeemDetails = [];
    let totalPaidQuantity = 0;
    for (const item of cart.items) {
      const product = item.product;
      const category = product.product_category;
      const cartQty = item.quantity;
      const redeemQty = redeemMap[product.id] || 0;
      if (
        category.loyaltyRequired === 0 &&
        isInRedeem(redeemItems, product.id) === true
      ) {
        return {
          status: 400,
          success: false,
          message: `Sorry we cannot redeem this product name : ${product.name}`,
        };
      }
      if (redeemQty > cartQty) {
        return {
          status: 400,
          success: false,
          message: `Trying to redeem more than in cart for ${product.name}`,
        };
      }

      const paidQty = cartQty - redeemQty;

      // Track loyalty usage
      const loyaltyPerUnit = category?.loyaltyRequired ?? 0;
      const loyaltyRequiredForItem = loyaltyPerUnit * redeemQty;
      totalTokensRequired += loyaltyRequiredForItem;

      if (redeemQty > 0) {
        redeemDetails.push({ productId: product.id, quantity: redeemQty });
        line_items.push({
          price_data: {
            currency: "GBP",
            product_data: {
              name: `${product.name} (Redeemed x${redeemQty})`,
            },
            unit_amount: 0,
          },
          quantity: redeemQty,
        });
      }

      if (paidQty > 0) {
        const amount = Math.round(product.price * 100);

        totalPaidAmount += amount * paidQty;

        line_items.push({
          price_data: {
            currency: "GBP",
            product_data: {
              name: `${product.name} (Paid x${paidQty})`,
            },
            unit_amount: amount,
          },
          quantity: paidQty,
        });
      }
      totalPaidQuantity += paidQty;
    }
    if (totalPaidQuantity === 0) {
      return {
        status: 400,
        success: false,
        message: `Please add at least one paid product`,
      };
    }

    if (totalTokensRequired > user.loyaltyPoints) {
      return {
        status: 400,
        success: false,
        message: `Insufficient loyalty tokens. Required: ${totalTokensRequired}, Available: ${user.loyaltyPoints}`,
      };
    }

    // Calculate 20% tax on payable amount (excluding redeemed items)
    const TAX_PERCENTAGE = 0.2;
    const totalTaxAmount = Math.round(totalPaidAmount * TAX_PERCENTAGE);

    // Tax line
    if (totalTaxAmount > 0) {
      line_items.push({
        price_data: {
          currency: "GBP",
          product_data: {
            name: "Tax (20% on paid items)",
          },
          unit_amount: totalTaxAmount,
        },
        quantity: 1,
      });
    }

    const serviceFee = calculateServiceCharge(totalPaidAmount);

    // Service charge
    line_items.push({
      price_data: {
        currency: "GBP",
        product_data: {
          name: "Service Charge",
        },
        unit_amount: serviceFee,
      },
      quantity: 1,
    });

    // Bag fee charge
    line_items.push({
      price_data: {
        currency: "GBP",
        product_data: {
          name: "Bag Fee",
        },
        unit_amount: BAG_FEE,
      },
      quantity: 1,
    });

    // delivery fee
    if (deliveryType === "delivery") {
      const deliveryFee = deliveryCharge(totalPaidAmount);
      line_items.push({
        price_data: {
          currency: "GBP",
          product_data: {
            name: "Delivery Fee",
          },
          unit_amount: deliveryFee,
        },
        quantity: 1,
      });
    }

    const session = await stripe.checkout.sessions.create({
      line_items,
      mode: "payment",
      success_url: `${process.env.FRONTEND_URL}/viewcart?status=success`,
      cancel_url: `${process.env.FRONTEND_URL}/viewcart?status=failed`,
      metadata: {
        redeemed: JSON.stringify(redeemDetails),
        loyaltyDeducted: totalTokensRequired.toString(),
      },
    });

    await redis.set(
      `checkout:${session.id}`,
      JSON.stringify({
        userId,
        loyaltyDeducted: totalTokensRequired,
        redeemDetails,
        deliveryType,
      }),
      "EX",
      60 * 60,
    );

    return {
      status: 200,
      success: true,
      message: "Checkout session created successfully.",
      data: {
        id: session.id,
        url: session.url,
      },
    };
  } catch (error) {
    console.error("Checkout Session Error:", error);
    throw error;
  }
};

// admin services

const getById = async (req) => {
  const isOrder = await orderModel.findByPk(req.params.id, {
    include: [
      {
        model: orderItemModel,
        as: "orderItems",
        include: [
          {
            model: productModel,
            as: "product",
          },
        ],
      },
      {
        model: customerModel,
        as: "customer",
      },
    ],
  });
  if (!isOrder) {
    return {
      status: 404,
      success: false,
      message: "Order not found",
    };
  }
  return {
    status: 200,
    success: true,
    data: isOrder,
    message: "Order get successfully",
  };
};

const list = async (req) => {
  try {
    let {
      limit,
      page,
      status,
      paymentStatus,
      paymentMethod,
      trackingNo,
      orderDate,
      email,
      sort,
      start,
      end,
      mobileNo,
    } = req.query;

    const filters = {};
    const include = [
      {
        model: orderItemModel,
        as: "orderItems",
        include: [
          {
            model: productModel,
            as: "product",
          },
        ],
      },
    ];
    const order = [["updatedAt", "DESC"]];

    if (paymentStatus)
      filters.paymentStatus = { [Op.like]: `%${paymentStatus}%` };
    if (status) filters.status = { [Op.like]: `%${status}%` };

    if (paymentMethod)
      filters.paymentMethod = { [Op.like]: `%${paymentMethod}%` };

    if (orderDate) {
      const date = new Date(orderDate);
      if (!isNaN(date.getTime())) {
        // Validate date
        const startOfDay = new Date(date.setHours(0, 0, 0, 0)); // Start of day
        const endOfDay = new Date(date.setHours(23, 59, 59, 999)); // End of day

        filters.orderDate = {
          [Op.between]: [startOfDay, endOfDay],
        };
      } else {
        console.warn("Invalid Order date");
      }
    }

    if (trackingNo) filters.trackingNo = { [Op.like]: `%${trackingNo}%` };
    if (email) filters.email = { [Op.eq]: email };
    if (mobileNo) filters.mobileNumber = { [Op.eq]: mobileNo };

    if (start && end) {
      if (new Date(start) > new Date(end)) {
        return {
          status: 400,
          data: null,
          message: "minDuration cannot be greater than maxDuration",
        };
      }

      filters.orderDate = {
        [Op.between]: [start, end],
      };
    }
    if (sort) {
      if (sort === "price") order.push(["totalAmount", "DESC"]);
      else if (sort === "latest") order.push(["createdAt", "DESC"]);
    }

    let result = await paginate(orderModel, {
      limit,
      page,
      filters,
      include,
      order,
    });

    if (result) {
      return {
        status: 200,
        success: true,
        data: result,
        message: "Order list successfully",
      };
    } else {
      return {
        status: 400,
        success: false,
        message: "Order list failure",
        data: null,
      };
    }
  } catch (error) {
    throw error;
  }
};

const updateStatus = async (req) => {
  const { paymentStatus, status } = req.body;
  const isOrder = await orderModel.findByPk(req.params.id, {
    include: [
      {
        model: customerModel,
        as: "customer",
      },
    ],
  });

  if (!isOrder) {
    return {
      status: 404,
      success: false,
      message: "Order not found",
    };
  }
  if (paymentStatus) {
    if (["complete", "failed", "expired"].includes(isOrder.paymentStatus)) {
      return {
        status: 404,
        success: false,
        message: "Payment status is already made",
      };
    }
  }
  if (status) {
    if (["delivered", "cancelled"].includes(isOrder.status)) {
      return {
        status: 404,
        success: false,
        message: "Order status is already made",
      };
    }
  }
  await isOrder.update({ ...req.body });
  // mailing for if(status = shipped & delivered & cancelled)

  // this is for order status only
  const placeholders = {
    name: isOrder.customer.username,
    email: isOrder.email,
    trackingNo: isOrder.trackingNo,
  };
  if (status === "shipped") {
    sendMail(
      "orderShipped",
      { ...placeholders, orderStatus: "shipped" },
      isOrder.email,
    ).catch((error) => {
      console.error("Mail sending error:", error);
    });
  }

  if (status === "delivered") {
    sendMail(
      "orderDelivered",
      { ...placeholders, orderStatus: "delivered" },
      isOrder.email,
    ).catch((error) => {
      console.error("Mail sending error:", error);
    });
  }
  if (status === "cancelled") {
    sendMail(
      "orderCancelled",
      { ...placeholders, orderStatus: "cancelled" },
      isOrder.email,
    ).catch((error) => {
      console.error("Mail sending error:", error);
    });
  }

  // use mail when there will be COD feature
  // mailing for if(payment method = complete & failed & expired)
  return {
    status: 200,
    success: true,
    message: "Order status update successfully",
    data: isOrder,
  };
};

module.exports = {
  // customer
  createOrder,
  incrementCartItem,
  decrementCartItem,
  removeCartItems,
  viewCart,

  // stripe
  createCheckoutSession,
  paymentSuccess,
  paymentFailed,

  // admin
  getById,
  list,
  updateStatus,
};
