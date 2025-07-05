const BACKEND_BASE = "https://mailtracker-3vc0.onrender.com";

function renderEmails(emails) {
  const container = document.getElementById('emails');
  container.innerHTML = '';
  emails.forEach(async (email) => {
    let status = '<span class="status">&#10003;</span>'; // single check
    let time = '';
    try {
      const res = await fetch(`${BACKEND_BASE}/status/${email.id}`);
      const data = await res.json();
      if (data.opened) {
        status = '<span class="status" style="color: #2196f3">&#10003;&#10003;</span>'; // double blue check
        time = `<span class="time">Read: ${new Date(data.time).toLocaleString()}</span>`;
      } else {
        time = `<span class="time">Sent: ${new Date(email.sent).toLocaleString()}</span>`;
      }
    } catch (e) {
      time = `<span class="time">(offline)</span>`;
    }
    const div = document.createElement('div');
    div.className = 'email';
    div.innerHTML = `${status}<span class="subject">${email.subject || '(No Subject)'}</span><br>${time}`;
    container.appendChild(div);
  });
}

chrome.storage.local.get({ trackedEmails: [] }, (data) => {
  renderEmails(data.trackedEmails.slice(-10).reverse()); // show last 10
}); 