require("../../helpers/oauth/google-oauth-helper");
require("../../helpers/oauth/local-oauth-helper");

const router = require("express").Router();
const passport = require("passport");
const {
  register,
  profile,
  getOrders,
  verify,
  logout,
  login,
  oAuthLogin,
  regenerateToken,
  forgetPassword,
  generateFPToken,
  verifyFPToken,
  update,
  changePassword,
  loginUser,
  createGuestAcc,
  updateGuestAcc,
  generateLoyaltyPoint,
} = require("../controllers/customer-controller");

const { isLoggedIn } = require("../../middlewares/is-logged-in");
const authenticateUser = require("../../middlewares/customer-auth-middleware");
const {
  loginValidation,
  registerValidation,
  verifyEmailValidation,
  regenerateTokenValidation,
  changePasswordValidation,
  forgetPasswordValidation,
  updateValidation,
} = require("../../validations/customer-validation");
const { isValidCaptcha } = require("../../middlewares/captcha-middleware");
const {
  loyaltyPostValidation,
} = require("../../validations/loyalty-validation");

router.get(
  "/google/callback",
  passport.authenticate("google", {
    successRedirect: "/backend/api/v1/customer/oauth-login",
    failureRedirect: "/backend/api/v1/customer/failure",
    scope: ["profile", "email"],
    prompt: "select_account",
  }),
);
router.get(
  "/facebook/callback",
  passport.authenticate("facebook", {
    successRedirect: "/backend/api/v1/customer/oauth-login",
    failureRedirect: "/backend/api/v1/customer/failure",
    scope: "email",
  }),
);

router.get(
  "/apple/callback",
  passport.authenticate("apple", {
    successRedirect: "/backend/api/v1/customer/oauth-login",
    failureRedirect: "/backend/api/v1/customer/failure",
  }),
);
router.post(
  "/login",
  loginValidation,
  passport.authenticate("local", {
    successRedirect: "/backend/api/v1/customer/local-login",
    failureRedirect: "/backend/api/v1/customer/failure",
    failureMessage: true,
  }),
);

router.post("/register", registerValidation, register);
router.patch("/verify", verifyEmailValidation, verify);
// router.post("/customer/login", loginValidation, loginUser);
router.post("/regenerate-otp", regenerateTokenValidation, regenerateToken);
router.post("/update-profile", authenticateUser, updateValidation, update);
router.post(
  "/generate-loyalty-point",
  authenticateUser,
  loyaltyPostValidation,
  generateLoyaltyPoint,
);

// testing needed
router.post("/create-guest", createGuestAcc);

router.put("/update-guest", updateValidation, updateGuestAcc);
// testing till here

router.get("/me", authenticateUser, profile);
router.get("/order", authenticateUser, getOrders);
router.get("/failure", (req, res) => {
  const message = req.session.messages?.pop() || "Login failed";
  res.status(401).json({ success: false, message });
});

router.get("/local-login", login);
router.get("/oauth-login", oAuthLogin);

router.patch(
  "/change-password",
  authenticateUser,
  changePasswordValidation,
  changePassword,
);
router.patch("/generate-fp-token", regenerateTokenValidation, generateFPToken);
router.patch("/verify-fp-token", verifyEmailValidation, verifyFPToken);
router.patch("/forget-password", forgetPasswordValidation, forgetPassword);
router.patch("/logout", authenticateUser, logout);

module.exports = router;
