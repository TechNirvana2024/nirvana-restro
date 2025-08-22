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
  listOrderItems,
} = require("../controllers/order-controller");

const {
  authentication,
  authorization,
} = require("../../middlewares/auth-middleware");
const {
  idValidation,
  paginationValidation,
} = require("../../validations/common-validation");
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
router.post("/create", createOrderValidation, createOrder);
router.patch(
  "/:id/items",
  authenticateUser,
  updateOrderItemsValidation,
  updateOrderItems,
);
router.get("/table/:id/active", getTableActiveOrders);

// Bulk serve order items (waiter)
router.patch(
  "/items/bulk-serve",
  // authentication,
  // authorization,
  bulkServeOrderItemsValidation,
  bulkServeOrderItems,
);

// Department update order items status
router.patch(
  "/items/status",
  // authentication,
  // authorization,
  updateOrderItemsStatusValidation,
  updateOrderItemsStatus,
);

// Checkout order (cashier)
router.patch(
  "/:id/checkout",
  // authentication,
  // authorization,
  idValidation,
  checkoutOrderValidation,
  checkoutOrder,
);

// Admin routes
router.get(
  "/list",
  //  authentication, authorization,
  // paginationValidation,
  listOrders,
);
router.get(
  "/list/order-items",
  //  authentication, authorization, to do later add in json
  // paginationValidation,
  listOrderItems,
);

router.get("/:id",
  //  authentication, authorization, 
  idValidation,
  getOrderById);
router.patch(
  "/:id/status",
  // authentication,
  // authorization,
  idValidation,
  updateOrderStatusValidation,
  updateOrderStatus,
);

module.exports = router;
