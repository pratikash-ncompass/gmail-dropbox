const { google } = require("googleapis");
const sendMail = require("../utils/gmail");

const credentials = require("../credentials.json");

const auth = new google.auth.OAuth2(
  credentials.web.client_id,
  credentials.web.client_secret,
  credentials.web.redirect_uris[0]
);
const gmail = google.gmail({ version: "v1", auth });

auth.setCredentials({ refresh_token: process.env.OAUTH_REFRESH_TOKEN });

const fetchEmails = async (req, res) => {
  const result = await gmail.users.messages.list({
    userId: "me",
    maxResults: 10,
  });

  const messages = result.data.messages;
  for (const message of messages) {
    const msg = await gmail.users.messages.get({
      userId: "me",
      id: message.id,
    });
    console.log(msg.data.snippet);
    res.send({ data: "successfully fetched!" });
  }
};

const sendMailFromNode = async (req, res) => {
  try {
    const receiver = req.body.receiver;
    const username = req.body.username;
  

    const fileAttachments = req.body.fileAttachments;
    console.log(fileAttachments);

    const options = {
      to: receiver,
      subject: `Hello ${username} 🚀`,
      text: "This email is sent from the command line",
      html: `<p>🙋🏻‍♀️  &mdash; This is a <b>test email</b> from <a href="https://google.com">Gmail</a>.</p>`,
      attachments: fileAttachments,
      textEncoding: "base64",
      headers: [
        { key: "X-Application-Developer", value: "Swastik Panda" },
        { key: "X-Application-Version", value: "v1.0.0.2" },
      ],
    };

    const messageId = await sendMail(options);
    console.log("Message sent successfully", messageId);
    return res.send({ msg: "Mail Sent Successfully!" });
  } catch (error) {
    console.log(error);
  }
};

module.exports = { fetchEmails, sendMailFromNode };
