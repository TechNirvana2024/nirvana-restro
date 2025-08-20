// This route is for admin to handle customer details
const {
  idValidation,
  paginationValidation,
} = require("../../validations/common-validation");
const {
  resetPasswordValidation,
  updateByAdminValidation,
} = require("../../validations/customer-validation");
const {
  authentication,
  authorization,
} = require("../../middlewares/auth-middleware");

const router = require("express").Router();
const {
  getByIdCustomer,
  updateByAdmin,
  block,
  archive,
  resetPassword,
  getAllCustomer,
} = require("../controllers/customer-controller");

router.get(
  "/list",
  authentication,
  authorization,
  paginationValidation,
  getAllCustomer,
);
router.get(
  "/:id",
  authentication,
  authorization,
  idValidation,
  getByIdCustomer,
);

router.put(
  "/:id",
  authentication,
  authorization,
  idValidation,
  updateByAdminValidation,
  updateByAdmin,
);

router.patch("/block/:id", authentication, authorization, idValidation, block);
router.patch(
  "/soft-delete/:id",
  authentication,
  authorization,
  idValidation,
  archive,
);
router.patch(
  "/reset-password/:id",
  authentication,
  authorization,
  idValidation,
  resetPasswordValidation,
  resetPassword,
);

module.exports = router;
