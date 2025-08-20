const router = require("express").Router();
const {
  getById,
  getOne,
  updateById,
} = require("../controllers/company-settings-controller");
const {
  authentication,
  authorization,
} = require("../../middlewares/auth-middleware");

const {
  companySettingsPutValidation,
} = require("../../validations/company-settings-validation");

const { idValidation } = require("../../validations/common-validation");

router.get("/", getOne);
router.get("/:id", idValidation, getById);
router.put(
  "/:id",
  authentication,
  authorization,
  idValidation,
  companySettingsPutValidation,
  updateById,
);

module.exports = router;
