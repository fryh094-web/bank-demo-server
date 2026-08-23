require("dotenv").config();

module.exports = {
  port: process.env.PORT || 10000,
  nodeEnv: process.env.NODE_ENV || "development"
};
