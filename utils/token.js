const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
const credentials = require('../credentials.json');

// Replace with the code you received from Google
const code = '4/0AeaYSHCTYsEevdbm30SIpJIyc1Mz3W9_JV0jkW1G-RNRIxX_-8eAJBLbmOJRHW9UQrGjXw';
const { client_secret, client_id, redirect_uris } = credentials.web;
const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

oAuth2Client.getToken(code).then(({ tokens }) => {
  const tokenPath = path.join(__dirname, 'token.json');
  fs.writeFileSync(tokenPath, JSON.stringify(tokens));
  console.log('Access token and refresh token stored to token.json');
});