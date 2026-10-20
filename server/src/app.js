const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const apiRoutes = require('./routes/api');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

// Static files for 3D Frontend Client
const clientPath = path.join(__dirname, '../../client');
app.use(express.static(clientPath));

// API Routes
app.use('/api', apiRoutes);

// Fallback to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(clientPath, 'index.html'));
});

// Central Error Handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('?? EMAIL & SMS SPAM DETECTION SYSTEM RUNNING');
  console.log(`?? Web UI:  http://localhost:${PORT}`);
  console.log(`? API:     http://localhost:${PORT}/api/predict`);
  console.log(`?? Stats:   http://localhost:${PORT}/api/stats`);
  console.log('='.repeat(60));
});

module.exports = app;
