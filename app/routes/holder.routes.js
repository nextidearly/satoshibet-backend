module.exports = (app) => {
  const ordinal = require("../controllers/holder.controller.js");

  var router = require("express").Router();

  // Check if an address is whitelisted or not.
  router.post("/", ordinal.getHoldersAndInscriptions);

  app.use("/api/holders", router);
};
