const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Route base
app.get('/', (req, res) => {
  res.send('Server attivo');
});

// Avvio server
app.listen(PORT, () => {
  console.log(`Server in ascolto sulla porta ${PORT}`);
});