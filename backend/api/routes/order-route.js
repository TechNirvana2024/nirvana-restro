const router = require("express").Router();

const {
  createOrder,
  updateOrderItems,
  getTableActiveOrders,
  getOrderById,
  listOrders,
  updateOrderStatus,
  bulkServeOrderItems,
  updateOrderItemsStatus,
  checkoutOrder,
} = require("../controllers/order-controller");

const {
  authentication,
  authorization,
} = require("../../middlewares/auth-middleware");

const {
  createOrderValidation,
  updateOrderItemsValidation,
  updateOrderStatusValidation,
  bulkServeOrderItemsValidation,
  updateOrderItemsStatusValidation,
  checkoutOrderValidation,
} = require("../../validations/order-validation");

const authenticateUser = require("../../middlewares/customer-auth-middleware");

// Customer/Staff routes
router.post("/create", authenticateUser, createOrderValidation, createOrder);
router.patch(
  "/:id/items",
  authenticateUser,
  updateOrderItemsValidation,
  updateOrderItems,
);
router.get("/table/:tableId/active", authenticateUser, getTableActiveOrders);

// Bulk serve order items (waiter)
router.patch(
  "/items/bulk-serve",
  authentication,
  authorization,
  bulkServeOrderItemsValidation,
  bulkServeOrderItems,
);

// Department update order items status
router.patch(
  "/items/status",
  authentication,
  authorization,
  updateOrderItemsStatusValidation,
  updateOrderItemsStatus,
);

// Checkout order (cashier)
router.patch(
  "/:id/checkout",
  authentication,
  authorization,
  checkoutOrderValidation,
  checkoutOrder,
);

// Admin routes
router.get("/list", authentication, authorization, listOrders);
router.get("/:id", authentication, authorization, getOrderById);
router.patch(
  "/:id/status",
  authentication,
  authorization,
  updateOrderStatusValidation,
  updateOrderStatus,
);

module.exports = router;
