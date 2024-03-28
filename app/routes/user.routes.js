module.exports = (app) => {
  const user = require("../controllers/user.controller.js");

  var router = require("express").Router();

  // Check if an address is whitelisted or not.
  router.post("/", user.generateAndSaveUserInfo);

  app.use("/api/user", router);
};
