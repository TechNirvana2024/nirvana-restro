const { Op } = require("sequelize");
const { v4: uuidv4 } = require("uuid");

const {
  customerModel,
  orderModel,
  orderItemModel,
  productModel,
  tableModel,
  productMediaModel,
} = require("../../models");

const { withTransaction } = require("../../helpers/order/transaction");

const paginate = require("../../utils/paginate");

const createOrder = async (req) => {
  const {
    orderType,
    tableId,
    customerId,
    customerName,
    customerPhone,
    customerEmail,
    orderItems,
    orderNote,
    estimatedTime,
    deliveryAddress,
    paymentMethod,
  } = req.body;

  return withTransaction(async (t) => {
    let sessionId = null;

    if (orderType === "dineIn") {
      const table = await tableModel.findByPk(tableId, {
        lock: t.LOCK.UPDATE,
        transaction: t,
      });

      if (!table) {
        return { status: 404, success: false, message: "Table not available" };
      }

      sessionId = table.currentSessionId;

      if (table.status === "available") {
        sessionId = uuidv4();
        await table.update(
          {
            status: "occupied",
            currentSessionId: sessionId,
            sessionStartTime: new Date(),
          },
          { transaction: t },
        );
      }
    }

    // Validate customer if customerId is provided
    if (customerId) {
      const customer = await customerModel.findByPk(customerId, {
        transaction: t,
      });
      if (!customer) {
        return { status: 404, success: false, message: "Customer not found" };
      }
    }

    let totalAmount = 0;
    const validatedItems = [];

    for (const item of orderItems) {
      const product = await productModel.findByPk(item.productId, {
        lock: t.LOCK.UPDATE,
        transaction: t,
      });

      if (!product) {
        return {
          status: 404,
          success: false,
          message: `Product with ID ${item.productId} not found`,
        };
      }

      if (product.quantity < item.quantity) {
        return {
          status: 400,
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${product.quantity}, Requested: ${item.quantity}`,
        };
      }

      const itemPrice = parseFloat(product.price);
      const itemSubtotal = itemPrice * item.quantity;
      totalAmount += itemSubtotal;

      validatedItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price: itemPrice,
        subtotal: itemSubtotal,
        specialInstructions: item.specialInstructions || null,
        departmentId: item.departmentId || null,
      });
    }

    const order = await orderModel.create(
      {
        customerId: customerId || null,
        tableId: orderType === "dineIn" ? tableId : null,
        sessionId: sessionId,
        orderType: orderType,
        status: "pending",
        paymentStatus: "pending",
        paymentMethod: paymentMethod || "cash",
        isGuestOrder: !customerId,
        totalAmount: totalAmount,
        orderNote: orderNote || null,
        estimatedTime: estimatedTime || null,
        customerName: customerName,
        customerPhone: customerPhone || null,
        customerEmail: customerEmail || null,
        deliveryAddress: orderType === "delivery" ? deliveryAddress : null,
      },
      { transaction: t },
    );

    const orderItemsData = validatedItems.map((item) => ({
      ...item,
      orderId: order.id,
    }));

    await orderItemModel.bulkCreate(orderItemsData, { transaction: t });

    for (const item of validatedItems) {
      await productModel.decrement("quantity", {
        by: item.quantity,
        where: { id: item.productId },
        transaction: t,
      });
    }

    const responseData = { order };
    if (orderType === "dineIn") {
      const table = await tableModel.findByPk(tableId, { transaction: t });
      responseData.sessionId = sessionId;
      responseData.tableNumber = table.tableNo;
    }

    return {
      status: 201,
      success: true,
      message: `${orderType.charAt(0).toUpperCase() + orderType.slice(1)} order created successfully`,
      data: responseData,
    };
  });
};

const addItemsToExistingOrder = async (req) => {
  const { orderId } = req.params;
  const { orderItems } = req.body;

  return withTransaction(async (t) => {
    const order = await orderModel.findByPk(orderId, {
      include: [
        {
          model: tableModel,
          as: "table",
        },
      ],
      transaction: t,
    });

    if (!order) {
      return { status: 404, success: false, message: "Order not found" };
    }

    if (order.status === "completed" || order.status === "cancelled") {
      return {
        status: 400,
        success: false,
        message: "Cannot add items to completed or cancelled order",
      };
    }

    let additionalAmount = 0;
    const validatedItems = [];

    for (const item of orderItems) {
      const product = await productModel.findByPk(item.productId, {
        lock: t.LOCK.UPDATE,
        transaction: t,
      });

      if (!product) {
        return {
          status: 404,
          success: false,
          message: `Product with ID ${item.productId} not found`,
        };
      }

      if (product.quantity < item.quantity) {
        return {
          status: 400,
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${product.quantity}, Requested: ${item.quantity}`,
        };
      }

      const itemPrice = parseFloat(product.price);
      const itemSubtotal = itemPrice * item.quantity;
      additionalAmount += itemSubtotal;

      validatedItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price: itemPrice,
        subtotal: itemSubtotal,
        specialInstructions: item.specialInstructions || null,
      });
    }

    const orderItemsData = validatedItems.map((item) => ({
      ...item,
      orderId: order.id,
    }));

    await orderItemModel.bulkCreate(orderItemsData, { transaction: t });

    await order.update(
      {
        totalAmount: parseFloat(order.totalAmount) + additionalAmount,
      },
      { transaction: t },
    );

    for (const item of validatedItems) {
      await productModel.decrement("quantity", {
        by: item.quantity,
        where: { id: item.productId },
        transaction: t,
      });
    }

    return {
      status: 200,
      success: true,
      message: "Items added to order successfully",
      data: {
        orderId: order.id,
        additionalAmount,
        newTotal: order.totalAmount,
      },
    };
  });
};

const getTableActiveOrders = async (req) => {
  const { tableId } = req.params;

  try {
    const table = await tableModel.findByPk(tableId);

    if (!table) {
      return { status: 404, success: false, message: "Table not found" };
    }

    if (!table.currentSessionId) {
      return {
        status: 200,
        success: true,
        message: "No active session for this table",
        data: {
          table: { id: table.id, tableNo: table.tableNo, status: table.status },
          orders: [],
          sessionTotal: 0,
        },
      };
    }

    const orders = await orderModel.findAll({
      where: {
        tableId: tableId,
        sessionId: table.currentSessionId,
        status: { [Op.notIn]: ["completed", "cancelled"] },
      },
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
        {
          model: customerModel,
          as: "customer",
          attributes: ["id", "username", "email"],
        },
      ],
      order: [["createdAt", "ASC"]],
    });

    const sessionTotal = orders.reduce(
      (sum, order) => sum + parseFloat(order.totalAmount),
      0,
    );

    return {
      status: 200,
      success: true,
      message: "Active orders retrieved successfully",
      data: {
        table: {
          id: table.id,
          tableNo: table.tableNo,
          status: table.status,
          sessionId: table.currentSessionId,
          sessionStartTime: table.sessionStartTime,
        },
        orders,
        sessionTotal,
      },
    };
  } catch (error) {
    console.error("Get table active orders error:", error);
    return {
      status: 500,
      success: false,
      message: "Internal server error",
      error: error.message,
    };
  }
};

const closeTableSession = async (req) => {
  const { tableId } = req.params;

  return withTransaction(async (t) => {
    const table = await tableModel.findByPk(tableId, {
      lock: t.LOCK.UPDATE,
      transaction: t,
    });

    if (!table) {
      return { status: 404, success: false, message: "Table not found" };
    }

    if (!table.currentSessionId) {
      return {
        status: 400,
        success: false,
        message: "No active session to close",
      };
    }

    const unpaidOrders = await orderModel.findAll({
      where: {
        sessionId: table.currentSessionId,
        paymentStatus: { [Op.ne]: "paid" },
      },
      transaction: t,
    });

    if (unpaidOrders.length > 0) {
      return {
        status: 400,
        success: false,
        message: `Cannot close session. ${unpaidOrders.length} unpaid orders remaining`,
        data: { unpaidOrdersCount: unpaidOrders.length },
      };
    }

    await orderModel.update(
      { status: "completed" },
      {
        where: {
          sessionId: table.currentSessionId,
          status: { [Op.ne]: "completed" },
        },
        transaction: t,
      },
    );

    await table.update(
      {
        status: "available",
        currentSessionId: null,
        sessionStartTime: null,
      },
      { transaction: t },
    );

    return {
      status: 200,
      success: true,
      message: "Table session closed successfully",
      data: {
        tableId: table.id,
        tableNo: table.tableNo,
        status: table.status,
      },
    };
  });
};

// Admin services
const getOrderById = async (req) => {
  const { id } = req.params;

  try {
    const order = await orderModel.findByPk(id, {
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
        {
          model: customerModel,
          as: "customer",
        },
        {
          model: tableModel,
          as: "table",
        },
      ],
    });

    if (!order) {
      return { status: 404, success: false, message: "Order not found" };
    }

    return {
      status: 200,
      success: true,
      message: "Order retrieved successfully",
      data: order,
    };
  } catch (error) {
    console.error("Get order by ID error:", error);
    return {
      status: 500,
      success: false,
      message: "Internal server error",
      error: error.message,
    };
  }
};

const listOrders = async (req) => {
  try {
    let {
      limit,
      page,
      status,
      paymentStatus,
      paymentMethod,
      orderType,
      tableId,
      orderDate,
      sort,
      start,
      end,
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
      {
        model: customerModel,
        as: "customer",
        attributes: ["id", "username", "email"],
      },
      {
        model: tableModel,
        as: "table",
        attributes: ["id", "tableNo"],
      },
    ];
    const order = [["updatedAt", "DESC"]];

    if (status) filters.status = { [Op.like]: `%${status}%` };
    if (paymentStatus)
      filters.paymentStatus = { [Op.like]: `%${paymentStatus}%` };
    if (paymentMethod)
      filters.paymentMethod = { [Op.like]: `%${paymentMethod}%` };
    if (orderType) filters.orderType = { [Op.like]: `%${orderType}%` };
    if (tableId) filters.tableId = tableId;

    if (orderDate) {
      const date = new Date(orderDate);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));
      filters.orderDate = { [Op.between]: [startOfDay, endOfDay] };
    }

    if (start && end) {
      filters.orderDate = { [Op.between]: [start, end] };
    }

    if (sort) {
      if (sort === "price") order.push(["totalAmount", "DESC"]);
      else if (sort === "latest") order.push(["createdAt", "DESC"]);
    }

    const result = await paginate(orderModel, {
      limit,
      page,
      filters,
      include,
      order,
    });

    return {
      status: 200,
      success: true,
      message: "Orders retrieved successfully",
      data: result,
    };
  } catch (error) {
    console.error("List orders error:", error);
    return {
      status: 500,
      success: false,
      message: "Internal server error",
      error: error.message,
    };
  }
};

const updateOrderStatus = async (req) => {
  const { id } = req.params;
  const { status, paymentStatus, paymentMethod } = req.body;

  return withTransaction(async (t) => {
    const order = await orderModel.findByPk(id, {
      include: [
        {
          model: customerModel,
          as: "customer",
        },
      ],
      transaction: t,
    });

    if (!order) {
      return { status: 404, success: false, message: "Order not found" };
    }

    if (paymentStatus && ["paid", "failed"].includes(order.paymentStatus)) {
      return {
        status: 400,
        success: false,
        message: "Payment status is already finalized",
      };
    }

    if (status && ["completed", "cancelled"].includes(order.status)) {
      return {
        status: 400,
        success: false,
        message: "Order status is already finalized",
      };
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;
    if (paymentMethod) updateData.paymentMethod = paymentMethod;

    await order.update(updateData, { transaction: t });

    return {
      status: 200,
      success: true,
      message: "Order updated successfully",
      data: order,
    };
  });
};

const updateOrderItemStatus = async (req) => {
  const { orderItemId } = req.params;
  const { status } = req.body;

  try {
    const orderItem = await orderItemModel.findByPk(orderItemId, {
      include: [
        {
          model: productModel,
          as: "product",
        },
      ],
    });

    if (!orderItem) {
      return { status: 404, success: false, message: "Order item not found" };
    }

    await orderItem.update({ status });

    return {
      status: 200,
      success: true,
      message: "Order item status updated successfully",
      data: orderItem,
    };
  } catch (error) {
    console.error("Update order item status error:", error);
    return {
      status: 500,
      success: false,
      message: "Internal server error",
      error: error.message,
    };
  }
};

module.exports = {
  createOrder,
  addItemsToExistingOrder,
  getTableActiveOrders,
  closeTableSession,
  getOrderById,
  listOrders,
  updateOrderStatus,
  updateOrderItemStatus,
};
