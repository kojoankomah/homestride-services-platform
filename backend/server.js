require("dotenv").config({ quiet: true });

const app = require("./src/app");

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`HomeStride API running on port ${PORT}`);
});