const express = require("express");
const cors = require("cors");
require("dotenv").config();

const routes = require("./routes");
const { testDatabaseConnection } = require("./config/database");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(routes);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Bank Demo Server is running"
  });
});

app.get("/db-test", async (req, res) => {
  try {
    await testDatabaseConnection();

    res.json({
      success: true,
      database: "connected"
    });
  } catch (error) {
    console.error("Database test failed:", error.message);

    res.status(500).json({
      success: false,
      database: "disconnected"
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
