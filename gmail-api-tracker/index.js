/*
 * Gmail API Tracked Email Sender
 *
 * 1. Go to https://console.cloud.google.com/ and create a project.
 * 2. Enable the Gmail API for your project.
 * 3. Create OAuth credentials (Desktop app) and download credentials.json.
 * 4. Place credentials.json in this folder.
 * 5. Run: npm install
 * 6. Run: node index.js
 * 7. Authorize the app in the browser and paste the code.
 *
 * The script will send a tracked email with a tracking pixel.
 */

const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];
const TOKEN_PATH = 'token.json';

fs.readFile('credentials.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  authorize(JSON.parse(content), sendMail);
});

function authorize(credentials, callback) {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

function sendMail(auth) {
  const gmail = google.gmail({ version: 'v1', auth });

  const trackingId = 'your-unique-id'; // Replace with a generated UUID if you want
  // Use your actual Render app URL below
  const trackingPixel = `<img src="https://mailtracker-3vc0.onrender.com/pixel?id=${trackingId}" width="1" height="1" style="display:none">`;

  const raw = makeBody(
    'aashijain3039@gmail.com', // <-- Change this to your recipient
    'me',
    'Tracked Email Subject',
    `<div>Hello! This email is tracked.${trackingPixel}</div>`
  );

  gmail.users.messages.send({
    userId: 'me',
    resource: {
      raw: raw,
    },
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    console.log('Email sent:', res.data);
  });
}

function makeBody(to, from, subject, message) {
  const str = [
    `Content-Type: text/html; charset=\"UTF-8\"\n`,
    `MIME-Version: 1.0\n`,
    `to: ${to}\n`,
    `from: ${from}\n`,
    `subject: ${subject}\n\n`,
    message
  ].join('');
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
} 