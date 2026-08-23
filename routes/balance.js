const express = require("express");
const { pool } = require("../config/database");

const router = express.Router();

router.post("/fetch_balance.php", async (req, res) => {
  try {
    const { account_number } = req.body;

    if (!account_number) {
      return res.status(400).json({
        status: "failed",
        success: false,
        message: "رقم الحساب مطلوب"
      });
    }

    const result = await pool.query(
      `
      SELECT
        account_number,
        name,
        balance,
        status
      FROM accounts
      WHERE account_number = $1
      LIMIT 1
      `,
      [account_number]
    );

    if (result.rows.length === 0) {
      return res.json({
        status: "failed",
        success: false,
        message: "الحساب غير موجود"
      });
    }

    const account = result.rows[0];

    if (account.status !== "active") {
      return res.json({
        status: "failed",
        success: false,
        message: "الحساب غير متاح"
      });
    }

    return res.json({
      status: "success",
      success: true,
      account_number: account.account_number,
      name: account.name,
      balance: String(account.balance)
    });

  } catch (error) {
    console.error("Balance error:", error.message);

    return res.status(500).json({
      status: "failed",
      success: false,
      message: "خطأ في الخادم"
    });
  }
});

module.exports = router;
