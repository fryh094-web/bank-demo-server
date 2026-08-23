const express = require("express");

const router = express.Router();

const loginRoutes = require("./login");
const balanceRoutes = require("./balance");
const healthRoutes = require("./health");

router.use("/api", loginRoutes);
router.use("/api", balanceRoutes);
router.use("/api", healthRoutes);

module.exports = router;
