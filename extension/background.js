// Background service worker for Gmail API OAuth and sending

// Helper: base64 encode for Gmail API
function base64urlEncode(str) {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Listen for messages from content.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SEND_TRACKED_EMAIL') {
    sendTrackedEmail(message.emailData)
      .then(result => sendResponse({ success: true, result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // async response
  }
});

async function sendTrackedEmail({ to, subject, body, trackingId }) {
  // 1. Get OAuth token
  const token = await new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: true }, token => {
      if (chrome.runtime.lastError || !token) {
        reject(new Error('Auth failed: ' + (chrome.runtime.lastError && chrome.runtime.lastError.message)));
      } else {
        resolve(token);
      }
    });
  });

  // 2. Inject tracking pixel into body
  const pixel = `<img src="https://mailtracker-3vc0.onrender.com/pixel?id=${trackingId}" width="1" height="1" style="display:none">`;
  const htmlBody = body + pixel;

  // 3. Build raw email
  const raw = base64urlEncode(
    `Content-Type: text/html; charset=\"UTF-8\"\n` +
    `MIME-Version: 1.0\n` +
    `to: ${to}\n` +
    `subject: ${subject}\n\n` +
    htmlBody
  );

  // 4. Send email via Gmail API
  const res = await fetch('https://www.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw })
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error('Gmail API error: ' + err);
  }
  return await res.json();
} 