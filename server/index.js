const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// In-memory log of opened emails
const opened = {};

// 1x1 transparent GIF
const pixel = Buffer.from(
  'R0lGODlhAQABAPAAAP///wAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==',
  'base64'
);

// Serve tracking pixel and log opens
app.get('/pixel', (req, res) => {
  const id = req.query.id;
  if (id) {
    // Only set the open time if it hasn't been set before
    if (!opened[id]) {
      opened[id] = { opened: true, time: new Date().toISOString() };
      console.log(`Pixel loaded for id: ${id}`);
    }
  }
  res.set('Content-Type', 'image/gif');
  res.send(pixel);
});

// Endpoint to check status
app.get('/status/:id', (req, res) => {
  const id = req.params.id;
  if (opened[id]) {
    res.json({ opened: true, time: opened[id].time });
  } else {
    res.json({ opened: false });
  }
});

app.listen(PORT, () => {
  console.log(`Pixel server running on port ${PORT}`);
}); 