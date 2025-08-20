const router = require("express").Router();
const express = require("express");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const {
  decrementCartItem,
  incrementCartItem,
  createOrder,
  getCarts,
  deleteCarts,
  createCheckoutSession,
  getById,
  list,
  updateStatus,
} = require("../controllers/order-controller");
const { paymentFailed, paymentSuccess } = require("../services/order-service");
const {
  authentication,
  authorization,
} = require("../../middlewares/auth-middleware");

const {
  createOrderPostValidation,
  decrementCartItemValidation,
  incrementCartItemValidation,
  removeCartValidation,
} = require("../../validations/order-validation");
const {
  paginationValidation,
  idValidation,
} = require("../../validations/common-validation");
const authenticateUser = require("../../middlewares/customer-auth-middleware");
const { isValidCaptcha } = require("../../middlewares/captcha-middleware");

// customer / guest routes

router.post(
  "/create-order",
  authenticateUser,
  isValidCaptcha,
  createOrderPostValidation,
  createOrder,
);
router.post(
  "/increment-cart-item",
  authenticateUser,
  incrementCartItemValidation,
  incrementCartItem,
);
router.post(
  "/decrement-cart-item",
  authenticateUser,
  decrementCartItemValidation,
  decrementCartItem,
);

router.delete("/", authenticateUser, removeCartValidation, deleteCarts);

router.get("/get-carts", authenticateUser, getCarts);

// admin routes

// things left update access json for this admin route

router.get("/list", authentication, authorization, list);
router.get("/:id", authentication, authorization, getById);
router.patch(
  "/status/:id",
  idValidation,
  authentication,
  authorization,
  updateStatus,
);

// Payment routes

router.post(
  "/create-checkout-session",
  authenticateUser,
  createCheckoutSession,
);

router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    try {
      const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.ENDPOINT_SECRET,
      );
      let paymentType = "stripe";
      switch (event.type) {
        case "checkout.session.completed":
          console.log(
            "Checkout Session completed:",
            event.data.object.id,
            event.data.object.payment_intent,
          );
          await paymentSuccess(paymentType, event.data.object);
          break;

        case "checkout.session.async_payment_succeeded":
          console.log(
            "Async Payment succeeded:",
            event.data.object.id,
            event.data.object.payment_intent,
          );
          await paymentSuccess(paymentType, event.data.object);
          break;

        case "checkout.session.async_payment_failed":
          console.log("Async Payment failed:", event.data.object.id);
          await paymentFailed(event.data.object);
          break;

        case "checkout.session.expired":
          console.log("Checkout Session expired:", event.data.object.id);
          await paymentFailed(event.data.object);
          break;

        case "payment_intent.created":
          console.log("Payment Intent created:", event.data.object.id);
          break;

        case "payment_intent.succeeded":
          console.log("Payment Intent succeeded:", event.data.object.id);
          await paymentSuccess(paymentType, event.data.object); // Fallback for out-of-order events
          break;

        case "payment_intent.payment_failed":
          console.log("Payment Intent failed:", event.data.object.id);
          await paymentFailed(event.data.object);
          break;

        case "payment_intent.canceled":
          console.log("Payment Intent canceled:", event.data.object.id);
          await paymentFailed(event.data.object);
          break;

        case "charge.succeeded":
          console.log("Charge succeeded:", event.data.object.id);
          await paymentSuccess(paymentType, event.data.object); // Fallback for out-of-order events
          break;

        case "charge.failed":
          console.log("Charge failed:", event.data.object.id);
          await paymentFailed(event.data.object);
          break;
        default:
          console.log(`Unhandled event type **** ${event.type} ****`);
      }
    } catch (err) {
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    res.status(200).send();
  },
);

module.exports = router;
