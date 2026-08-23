const express = require("express");
const crypto = require("crypto");
const { pool } = require("../config/database");

const router = express.Router();

function hashPassword(password) {
  return crypto
    .createHash("sha256")
    .update(password, "utf8")
    .digest("hex");
}

router.post("/login2.php", async (req, res) => {
  try {
    const {
      account_number,
      password,
      device_id,
      app_version_code,
      auth_hash
    } = req.body;

    // التحقق من البيانات المطلوبة
    if (!account_number || !password || !device_id || !app_version_code || !auth_hash) {
      return res.status(400).json({
        status: "failed",
        success: false,
        message: "بيانات الطلب ناقصة"
      });
    }

    // البحث عن الحساب
    const result = await pool.query(
      `
      SELECT
        id,
        account_number,
        full_account,
        short_account,
        name,
        password_hash,
        account_type,
        branch,
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

    // التأكد من حالة الحساب
    if (account.status !== "active") {
      return res.json({
        status: "failed",
        success: false,
        message: "الحساب غير متاح"
      });
    }

    // التحقق من كلمة المرور
    const passwordHash = hashPassword(password);

    if (passwordHash !== account.password_hash) {
      return res.json({
        status: "failed",
        success: false,
        message: "بيانات الدخول غير صحيحة"
      });
    }

    /*
     * auth_hash:
     * التطبيق يستخدم HMAC-SHA256 ومفتاحه يأتي من NativeLib.
     * المفتاح الحقيقي غير موجود في الأكواد التي أرسلتها،
     * لذلك لا نخمنه هنا.
     *
     * سيتم إكمال التحقق منه بعد تحديد المفتاح/آلية التوقيع.
     */

    return res.json({
      status: "success",
      success: true,
      message: "تم تسجيل الدخول",
      account: {
        account_number: account.account_number,
        full_account: account.full_account,
        short_account: account.short_account,
        name: account.name,
        account_type: account.account_type,
        branch: account.branch,
        balance: String(account.balance)
      }
    });

  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      status: "failed",
      success: false,
      message: "خطأ في الخادم"
    });
  }
});

module.exports = router;
