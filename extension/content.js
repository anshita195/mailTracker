console.log("MailStats content script loaded")

// Utility to generate a UUID
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Observe Gmail compose windows
const observer = new MutationObserver(() => {
  const composeWindows = document.querySelectorAll('div[role="dialog"]');
  composeWindows.forEach(compose => {
    // Find the editable email body
    const body = compose.querySelector('[aria-label="Message Body"], div[contenteditable="true"]');
    if (body && !body.hasAttribute('data-mailtrack-injected')) {
      body.setAttribute('data-mailtrack-injected', 'true');
      const id = uuidv4();
      const pixel = `<img src="http://localhost:3000/pixel?id=${id}" width="1" height="1" style="display:none">`;
      body.innerHTML += pixel;
      console.log("Injected pixel (on compose open):", pixel);
      console.log("Body after injection:", body.innerHTML);
      // Get subject
      const subjectInput = document.querySelector('input[name="subjectbox"]');
      const subject = subjectInput ? subjectInput.value : '';
      // Store in chrome.storage
      chrome.storage.local.get({ trackedEmails: [] }, (data) => {
        const trackedEmails = data.trackedEmails;
        trackedEmails.push({ id, subject, sent: new Date().toISOString() });
        chrome.storage.local.set({ trackedEmails });
      });
    }
  });
});

observer.observe(document.body, { childList: true, subtree: true }); 