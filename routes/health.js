const express = require("express");

const router = express.Router();

router.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "ok",
    service: "bank-demo-server"
  });
});

module.exports = router;
