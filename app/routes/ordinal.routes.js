module.exports = (app) => {
  const ordinal = require("../controllers/ordinal.controller.js");

  var router = require("express").Router();

  // Check if an address is whitelisted or not.
  router.post("/whitelisted", ordinal.checkIsWhitelisted);

  // Retrieve an order by orderId
  router.get("/mint/order/:id", ordinal.getOrderById);

  // Retrieve order list by receive address
  router.get("/mint/order/list/:address", ordinal.getOrderListByAddress);

  // Queue order to get inscription Id
  router.post("/mint/order/check", ordinal.mintAndQueue);

  // Create Order to mint
  router.post("/mint/order/create", ordinal.createOrder);

  app.use("/api/ordinals", router);
};
