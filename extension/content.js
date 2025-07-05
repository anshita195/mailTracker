console.log("MailStats content script loaded")

// Utility to generate a UUID
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const RENDER_PIXEL_BASE = "https://mailtracker-3vc0.onrender.com/pixel";

// Observe Gmail compose windows
const observer = new MutationObserver(() => {
  const composeWindows = document.querySelectorAll('div[role="dialog"]');
  composeWindows.forEach(compose => {
    // Find the native send button
    const sendBtn = compose.querySelector('div[role="button"][data-tooltip^="Send"]');
    // Avoid adding multiple times
    if (sendBtn && !compose.querySelector('.mailstats-send-tracked')) {
      // Create the Send Tracked button as a <button>
      const trackedBtn = document.createElement('button');
      trackedBtn.textContent = 'Send Tracked';
      trackedBtn.className = 'mailstats-send-tracked';
      trackedBtn.style.background = '#2196f3';
      trackedBtn.style.color = '#fff';
      trackedBtn.style.marginLeft = '8px';
      trackedBtn.style.cursor = 'pointer';
      trackedBtn.style.borderRadius = '4px';
      trackedBtn.style.padding = '0 12px';
      trackedBtn.style.display = 'inline-flex';
      trackedBtn.style.alignItems = 'center';
      trackedBtn.style.height = sendBtn.offsetHeight + 'px';
      trackedBtn.style.border = 'none';
      trackedBtn.style.fontSize = '14px';
      // Insert after the native send button
      sendBtn.parentNode.insertBefore(trackedBtn, sendBtn.nextSibling);
      // Click handler
      trackedBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        // Get recipients
        const chipDivs = compose.querySelectorAll('div[aria-label="To"] [role="option"][data-hovercard-id]');
        let to = '';
        if (chipDivs.length > 0) {
          to = Array.from(chipDivs)
            .map(div => div.getAttribute('data-hovercard-id'))
            .filter(Boolean)
            .join(',');
        }
        console.log('Recipient:', to);
        // Get subject
        const subjectInput = document.querySelector('input[name="subjectbox"]');
        const subject = subjectInput ? subjectInput.value : '';
        // Get body (HTML)
        let bodyElem = compose.querySelector('[aria-label="Message Body"]');
        let body = bodyElem ? bodyElem.innerHTML : '';
        if (!body) {
          // Try fallback selector
          bodyElem = compose.querySelector('div[contenteditable="true"]');
          body = bodyElem ? bodyElem.innerHTML : '';
        }
        // Log values for debugging
        console.log('MailStats debug:');
        console.log('Recipient:', to);
        console.log('Subject:', subject);
        console.log('Body:', body);
        if (!to || !body) {
          alert('Please enter recipient and message body.');
          return;
        }
        const id = uuidv4();
        // Store in chrome.storage
        chrome.storage.local.get({ trackedEmails: [] }, (data) => {
          const trackedEmails = data.trackedEmails;
          trackedEmails.push({ id, subject, sent: new Date().toISOString() });
          chrome.storage.local.set({ trackedEmails });
        });
        // Send to background for Gmail API send
        chrome.runtime.sendMessage({
          type: 'SEND_TRACKED_EMAIL',
          emailData: { to, subject, body, trackingId: id }
        }, (response) => {
          if (response && response.success) {
            alert('Tracked email sent!');
            // Optionally, close the compose window
            const closeBtn = compose.querySelector('img[aria-label="Close"]');
            if (closeBtn) closeBtn.click();
          } else {
            alert('Failed to send tracked email: ' + (response && response.error));
          }
        });
      });
    }
  });
});

observer.observe(document.body, { childList: true, subtree: true }); 