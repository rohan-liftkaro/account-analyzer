/**
 * Express Web Server for Bank Statement Analyzer.
 */

const express = require('express');
const path = require('path');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static frontend
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.json());

// Serve generated output files for download
app.use('/downloads', express.static(path.join(__dirname, '..', '..', 'output')));

// API routes
app.use('/api', apiRoutes);

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

const server = app.listen(PORT, () => {
  console.log(`\n  🚀 Bank Statement Analyzer running at:`);
  console.log(`     http://localhost:${PORT}\n`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`⚠️  Port ${PORT} is in use, trying port ${+PORT + 1}...`);
    app.listen(+PORT + 1, () => {
      console.log(`\n  🚀 Bank Statement Analyzer running at:`);
      console.log(`     http://localhost:${+PORT + 1}\n`);
    });
  } else {
    throw err;
  }
});
