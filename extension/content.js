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
      // Create the Send Tracked button
      const trackedBtn = document.createElement('div');
      trackedBtn.textContent = 'Send Tracked';
      trackedBtn.className = sendBtn.className + ' mailstats-send-tracked';
      trackedBtn.style.background = '#2196f3';
      trackedBtn.style.color = '#fff';
      trackedBtn.style.marginLeft = '8px';
      trackedBtn.style.cursor = 'pointer';
      trackedBtn.style.borderRadius = '4px';
      trackedBtn.style.padding = '0 12px';
      trackedBtn.style.display = 'inline-flex';
      trackedBtn.style.alignItems = 'center';
      trackedBtn.style.height = sendBtn.offsetHeight + 'px';
      // Insert after the native send button
      sendBtn.parentNode.insertBefore(trackedBtn, sendBtn.nextSibling);
      // Click handler
      trackedBtn.addEventListener('click', () => {
        const body = compose.querySelector('[aria-label="Message Body"], div[contenteditable="true"]');
        if (body) {
          const id = uuidv4();
          const pixel = `<img src=\"${RENDER_PIXEL_BASE}?id=${id}\" width=\"1\" height=\"1\" style=\"display:none\">`;
          body.focus();
          document.execCommand('insertHTML', false, pixel);
          // Get subject
          const subjectInput = document.querySelector('input[name="subjectbox"]');
          const subject = subjectInput ? subjectInput.value : '';
          // Store in chrome.storage
          chrome.storage.local.get({ trackedEmails: [] }, (data) => {
            const trackedEmails = data.trackedEmails;
            trackedEmails.push({ id, subject, sent: new Date().toISOString() });
            chrome.storage.local.set({ trackedEmails });
          });
          // Click the native send button
          sendBtn.click();
        } else {
          alert('Could not find message body to inject tracking pixel.');
        }
      });
    }
  });
});

observer.observe(document.body, { childList: true, subtree: true }); 