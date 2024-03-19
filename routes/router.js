const express = require("express");
const { fetchEmails, sendMailFromNode, authorizeGmail, authorizeGmailCallBack, processEmail } = require("../controllers/controller");

const router = express.Router();

router.get("/fetchMails", fetchEmails);

router.post("/send-mail", sendMailFromNode);



router.get('/authorize-gmail', authorizeGmail)

router.get('/authorize-gmail/callback', authorizeGmailCallBack)

router.get('/process-emails', processEmail)

module.exports = router
