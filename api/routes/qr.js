const express = require('express');
const router = express.Router();
const pool = require('../utils/db');
const { authenticateJWT, authorizeRole } = require('../middlewares/authMiddleware');