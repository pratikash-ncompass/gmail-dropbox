const express = require("express");
require("dotenv").config();

const app = express();
const port = 3000;
app.use(express.json());

const mailRouter = require("./routes/router");

app.use("/mail", mailRouter);

app.listen(port, () => {
  console.log(`nodemailerProject is listening at http://localhost:${port}`);
});
