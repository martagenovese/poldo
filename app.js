const logger = require('./utils/logger');

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Route base
app.get('/', (req, res) => {
  res.send('Server attivo');
});

// Avvio server
app.listen(PORT, () => {
  app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));
});