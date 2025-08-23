const { Op} = require("sequelize");

const generateUUID  = require("../../utils/uuidGenerator");

const {
  customerModel,
  orderModel,
  orderItemModel,
  productModel,
  tableModel,
  productMediaModel,
  sequelize
} = require("../../models");

const { withTransaction } = require("../../helpers/order/transaction");

const paginate = require("../../utils/paginate");

const createOrder = async (req) => {
  const transaction = await sequelize.transaction();
  try {
    const { orderType, tableId, orderItems = [] } = req.body;
    let table = null;
    let sessionId = null;

    if (orderType === "dineIn") {
      table = await tableModel.findByPk(tableId, { transaction });
      if (!table) {
        await transaction.rollback();
        return { status: 404, success: false, message: "Table not found" };
      }

      if (table.status === "available") {
        sessionId = generateUUID();
        await table.update(
          {
            status: "occupied",
            sessionId,
            sessionStartTime: new Date(),
          },
          { transaction }
        );
      } else {
        sessionId = table.sessionId;
      }
    }

    const order = await orderModel.create(
      {
        ...req.body,
        sessionId,
        orderStartTime: new Date(),
      },
      { transaction }
    );

    let totalAmount = 0;

    for (const item of orderItems) {
      const product = await productModel.findByPk(item.productId, {
        transaction,
      });
      if (!product) {
        await transaction.rollback();
        return {
          status: 404,
          success: false,
          message: `Product with ID ${item.productId} not found`,
        };
      }

      const subtotal = product.price * item.quantity;
      totalAmount += subtotal;

      await orderItemModel.create(
        {
          ...item,
          orderId: order.id,
          price: product.price,
          departmentId: product.departmentId,
          subtotal,
        },
        { transaction }
      );
    }

    await order.update({ totalAmount }, { transaction });

    await transaction.commit();

    return {
      status: 201,
      success: true,
      message: "Order created successfully",
      data: order,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const updateOrderItems = async (req) => {
  const transaction = await sequelize.transaction();
  try {
    const { orderId } = req.params;
    const { items = [] } = req.body;

    const order = await orderModel.findByPk(orderId, {
      include: [{ model: orderItemModel, as: "orderItems" }],
      transaction,
    });

    if (!order) {
      await transaction.rollback();
      return { status: 404, success: false, message: "Order not found" };
    }
   const newItems = items.filter(i => !i.id)
   const oldItems = items.filter(i=> i.id)
    for (const incoming of oldItems) {
      const existing = order.orderItems.find((oi) => oi.id === incoming.id);
      if (!existing) {
        await transaction.rollback();
        return {
          status: 404,
          success: false,
          message: `Order item ${incoming.id} not found`,
        };
      }

      // Check for status change
      if (incoming.status && incoming.status !== existing.status) {
        if (incoming.status === "cancelled") {
          if (existing.status === "preparing") {
            await transaction.rollback();
            return {
              status: 400,
              success: false,
              message: `Cannot cancel item ${existing.id}, already in preparing`,
            };
          }
          await existing.update(
            { status: "cancelled", subtotal: 0 },
            { transaction }
          );
          continue; // skip quantity check since it's cancelled
        }
      }

      // Check for quantity change
      if (incoming.quantity !== undefined && incoming.quantity !== existing.quantity) {
        if (incoming.quantity < existing.quantity && existing.status === "preparing") {
          await transaction.rollback();
          return {
            status: 400,
            success: false,
            message: `Cannot decrease quantity for item ${existing.id}, already in preparing`,
          };
        }

        const newSubtotal = existing.price * incoming.quantity;
        await existing.update(
          { quantity: incoming.quantity, subtotal: newSubtotal },
          { transaction }
        );
      }
    }
    if(newItems.length>0){
    for (const item of newItems) {
      const product = await productModel.findByPk(item.productId, {
        transaction,
      });
      if (!product) {
        await transaction.rollback();
        return {
          status: 404,  
          success: false,
          message: `Product with ID ${item.productId} not found`,
        };
      }
      const subtotal = product.price * item.quantity;
      await orderItemModel.create(
        {
          ...item,
          orderId: order.id,
          price: product.price,
          departmentId: product.departmentId,
          subtotal,
        },
        { transaction }
      );
    }
    }

    // Recalculate order total (exclude cancelled)
    const validItems = await orderItemModel.findAll({
      where: { orderId, status: { [Op.ne]: "cancelled" } },
      transaction,
    });

    const totalAmount = validItems.reduce(
      (sum, item) => sum + Number(item.subtotal),
      0
    );

    await order.update({ totalAmount }, { transaction });

    await transaction.commit();

    return {
      status: 200,
      success: true,
      message: "Order items updated successfully",
      data: order,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const getTableActiveOrders = async (req) => {
  const { id:tableId } = req.params;

  try {
    const table = await tableModel.findByPk(tableId);

    if (!table) {
      return { status: 404, success: false, message: "Table not found" };
    }

    if (!table.sessionId) {
      return {
        status: 200,
        success: true,
        message: "No active session for this table",
        data: null
      };
    }

    const orders = await orderModel.findAll({
      where: {
        tableId: tableId,
        sessionId: table.sessionId,
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
          attributes: ["id", "email"],
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
          sessionId: table.sessionId,
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

const checkoutOrder = async (req) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    let { customerId, customerDetails, ...updateData } = req.body;

    const order = await orderModel.findByPk(id, { transaction });
    if (!order) {
      await transaction.rollback();
      return { status: 404, success: false, message: "Order not found" };
    }

    if (
      ["paid", "failed"].includes(order.paymentStatus) ||
      ["completed", "cancelled"].includes(order.status)
    ) {
      await transaction.rollback();
      return {
        status: 400,
        success: false,
        message: "Order already processed",
      };
    }

    let finalCustomerId = null;

    if (customerId) {
      const customer = await customerModel.findByPk(customerId, { transaction });
      if (!customer) {
        await transaction.rollback();
        return { status: 404, success: false, message: "Customer not found" };
      }
      finalCustomerId = customer.id;
    }

    if (customerDetails) {
      const newCustomer = await customerModel.create(customerDetails, { transaction });
      if (!newCustomer) {
        await transaction.rollback();
        return {
          status: 500,
          success: false,
          message: "Failed to create customer",
        };
      }
      finalCustomerId = newCustomer.id;
    }

    await order.update(
      {
        ...updateData,
        orderFinishTime: new Date(),
        customerId: finalCustomerId,
        isGuestOrder: req.body?.isGuestOrder ?? false,
      },
      { transaction }
    );

// if table has other active order than 
    const stillOrderInTable = await  orderModel.findAll({
      where: {
        tableId: tableId,
        sessionId: table.sessionId,
        status: { [Op.notIn]: ["completed", "cancelled"] },
      },
    });


    if(stillOrderInTable.length===0){
    await tableModel.update({
      status: "available",
      sessionId: null,
      sessionStartTime: null,
    }, {
      where: { id: order.tableId },
      transaction,
    })
    }

    await transaction.commit();

    return {
      status: 200,
      success: true,
      message: "Order checked out successfully",
      data: order,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

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

// this is for waiters to mark order items as served
const bulkServeOrderItems = async (req) => {
  const { orderItemIds } = req.body; // array of orderItem ids
  
  try {
    // fetch order items
    const orderItems = await orderItemModel.findAll({
      where: { id: orderItemIds ,status: "ready" },
    });

    if (orderItems.length === 0) {
      return { status: 404, success: false, message: "Order items not found or not ready yet" };
    }

    await Promise.all(
      orderItems.map((item) => item.update({ status: "served" }))
    );

    return {
      status: 200,
      success: true,
      message: "Order items served successfully",
      data: orderItems,
    };
  } catch (error) {
   throw error
  }
};

// this is for departments to update order item status
const updateOrderItemsStatus = async (req) => {
  let { orderItemIds } = req.body; 
  const { status } = req.body; 


  const transaction = await sequelize.transaction();  

  try {
    const orderItems = await orderItemModel.findAll({
      where: { id: orderItemIds },
      transaction,
    });

    if (!orderItems.length) {
      await transaction.rollback();
      return { status: 404, success: false, message: "Order item(s) not found" };
    }

    const invalidItems = [];

    for (const item of orderItems) {
      // enforce transitions: pending->preparing, preparing->ready
      if (
        (status === "preparing" && item.status !== "pending") ||
        (status === "ready" && item.status !== "preparing")
      ) {
        invalidItems.push({
          id: item.id,
          currentStatus: item.status,
          attemptedStatus: status,
        });
        continue;
      }

      await item.update({ status }, { transaction });
    }

    if (invalidItems.length > 0) {
      await transaction.rollback();
      return {
        status: 400,
        success: false,
        message: "Some order items could not be updated due to invalid transitions",
        invalidItems,
      };
    }

    await transaction.commit();
    return {
      status: 200,
      success: true,
      message: `Order item(s) updated to ${status} successfully`,
      data: orderItems,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};


// for waiter , department and all 
const getOrderItems = async (req) => {
  try {
    let { limit, page, status } = req.query;
    const filters = {};
    const include = [];

    if (status) {
      filters.status = {
        [Op.like]: `%${status}%`,
      };
    }

    const result = await paginate(orderItemModel, {
      limit,
      page,
      filters,
      include,
    });

    if (!result) {
      return {
        status: 500,
        success: false,
        message: `Order Items List Failed`,
      };
    }
    return {
      status: 200,
      success: true,
      message: `Order Items successfully`,
      data: result,
    };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getTableActiveOrders,
  getOrderById,
  listOrders,
  updateOrderStatus,
  
  // waiter services
  createOrder,
  updateOrderItems,
  bulkServeOrderItems,

  // cashier services
  checkoutOrder,

  getOrderItems,

  //department services
  updateOrderItemsStatus,
};
