const router = require("express").Router();

const {
  createOrder,
  addItemsToExistingOrder,
  getTableActiveOrders,
  closeTableSession,
  getOrderById,
  listOrders,
  updateOrderStatus,
  updateOrderItemStatus,
} = require("../controllers/restaurant-order-controller");

const {
  authentication,
  authorization,
} = require("../../middlewares/auth-middleware");

const {
  createOrderValidation,
  addItemsToOrderValidation,
  updateOrderStatusValidation,
  updateOrderItemStatusValidation,
} = require("../../validations/restaurant-order-validation");

const authenticateUser = require("../../middlewares/customer-auth-middleware");

// Customer/Staff routes

router.post("/create", authenticateUser, createOrderValidation, createOrder);

router.post(
  "/:orderId/add-items",
  authenticateUser,
  addItemsToOrderValidation,
  addItemsToExistingOrder,
);

router.get("/table/:tableId/active", authenticateUser, getTableActiveOrders);

router.post(
  "/table/:tableId/close-session",
  authenticateUser,
  closeTableSession,
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

router.patch(
  "/item/:orderItemId/status",
  authentication,
  authorization,
  updateOrderItemStatusValidation,
  updateOrderItemStatus,
);

module.exports = router;
