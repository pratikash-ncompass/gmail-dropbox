const express = require("express");
const { fetchEmails, sendMailFromNode } = require("../controllers/controller");

const router = express.Router();

router.get("/fetchMails", fetchEmails);

router.post("/send-mail", sendMailFromNode);

module.exports = router;
