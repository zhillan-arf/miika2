import "dotenv/config";
import express from "express";

const PORT = process.env.PORT || 3009;

const app = express();

app.get("/api/v1/hello", (req, res) => {
  res.send("Hello World");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
