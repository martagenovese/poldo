require('dotenv').config({ path: 'secrets.env' });

const express = require('express');
const logger = require('./utils/logger');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();
const PORT = process.env.PORT;

// Middleware
app.use(express.json());
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url}`);
    next();
});

// Routes
app.use("/v1/auth", authRoutes);
//app.use(adminRoutes);
app.use("/v1/prodotti", productRoutes);
app.use('/v1/ordini', orderRoutes);
//app.use(reportRoutes);

// Error handling
app.use((err, req, res, next) => {
    logger.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
});