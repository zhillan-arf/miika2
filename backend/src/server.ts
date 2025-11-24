// backend/src/server.ts
import "dotenv/config";
import app from "./app.ts";

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});