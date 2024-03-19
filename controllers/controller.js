const { google } = require("googleapis");
const sendMail = require("../utils/gmail");

const { Dropbox } = require('dropbox');
const dotenv = require('dotenv');
const fs=require('fs');
dotenv.config();

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





const gmailClient = new google.auth.OAuth2({
    clientId: process.env.GMAIL_CLIENT_ID,
    clientSecret: process.env.GMAIL_CLIENT_SECRET,
    redirectUri: process.env.GMAIL_REDIRECT_URI,
});

// Initialize Dropbox client
const dropboxClient = new Dropbox({ accessToken: process.env.DROPBOX_ACCESS_TOKEN });

// Route to initiate OAuth2 authorization flow for Gmail
const authorizeGmail = (req, res) => {
    const url = gmailClient.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/gmail.modify'],
    });
    res.redirect(url);
};


const authorizeGmailCallBack = async (req, res) => {
    const code = req.query.code;
    try {
        const { tokens } = await gmailClient.getToken(code);
        gmailClient.setCredentials(tokens);
        console.log(tokens);
        res.send('Gmail authorization successful! Tokens received and stored.');
    } catch (error) {
        console.error('Error exchanging authorization code for Gmail tokens:', error);
        res.status(500).send('Failed to exchange authorization code for Gmail tokens');
    }
};

const processEmail = async (req, res) => {
    try {
        const gmail = google.gmail({ version: 'v1', auth: gmailClient });
        const response = await gmail.users.messages.list({
            userId: 'me',
            q: 'is:unread has:attachment',
        });

        if (!response.data.messages || response.data.messages.length === 0) {
            res.send('No unread emails with attachments found');
            return;
        }
        const messages = response.data.messages;

        for (const message of messages) {
            console.log('Message:', message); 
           
            const messageId = message.id;
            const email = await gmail.users.messages.get({ userId: 'me', id: messageId });
            const attachments = email.data.payload.parts.filter(part => part.filename);
            for (const attachment of attachments) {
                const attachmentId = attachment.body.attachmentId;
                const attachmentData = await gmail.users.messages.attachments.get({
                    userId: 'me',
                    messageId: messageId,
                    id: attachmentId,
                });

                try {
                    const fileType = getAttachmentFileType(attachment.filename);
                    if (fileType) {
                        let fileData;
                        if (fileType === '.pdf') {
                            console.log(attachmentData.data);
                            console.log(fileType);
                            //fileData = attachmentData.data;
                            const filePath = `${attachment.filename}_${Date.now()}.pdf`;
                             const attachmentObject = JSON.parse(JSON.stringify(attachmentData.data));

                  
//                     const fileData = Buffer.from(attachmentObject.data, 'base64').toString();

                            fs.writeFileSync(filePath, Buffer.from(attachmentObject.data, 'base64'));
                         // const attachmentObject = JSON.parse(JSON.stringify(attachmentData.data));


                            fileData = fs.readFileSync(filePath);
                            fs.unlinkSync(filePath); // Remove temporary file

                        } else {
                            const attachmentObject = JSON.parse(JSON.stringify(attachmentData.data));

                            fileData = Buffer.from(attachmentObject.data, 'base64').toString();
                        }
                        // const fileData = Buffer.from(attachmentData.data, 'base64').toString();
                        const fileName = `${attachment.filename}_${Date.now()}`;

                        console.log(`Content of ${fileName}: ${fileData}`);
                        await dropboxClient.filesUpload({
                            path: `/attachments/${fileName}`,  
                            contents: fileData,
                        });
                    } else {
                        console.log(`Skipping attachment ${attachment.filename} as it is not a supported file format`);
                    }
                } catch (error) {
                    console.error(`Error processing attachment ${attachment.filename}:`, error);
                }
            }

            // Mark the email as read to prevent duplicate processing
            await gmail.users.messages.modify({
                userId: 'me',
                id: messageId,
                requestBody: { removeLabelIds: ['UNREAD'] },
            });
        }

        res.send('Attachments processed successfully and saved to Dropbox');
    } catch (error) {
        console.error('Error processing emails:', error);
        res.status(500).send('Failed to process emails');
    }
};






function getAttachmentFileType(filename) {
    const supportedFormats = ['.txt', '.jpg', '.jpeg', '.png', '.pdf'];
    const fileExtension = filename.substring(filename.lastIndexOf('.')).toLowerCase();
    return supportedFormats.includes(fileExtension) ? fileExtension : null;
}

module.exports = {authorizeGmail, authorizeGmailCallBack, processEmail,fetchEmails, sendMailFromNode};

