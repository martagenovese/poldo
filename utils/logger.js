const winston = require('winston');
const path = require('path');
const { VIDEO_FOLDER } = require('../config/config');

const logger = winston.createLogger({
    level: 'debug',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
    ),
    transports: [
        new winston.transports.File({ 
            filename: path.join(VIDEO_FOLDER, 'poldo.log'),
            flags: 'a'
        }),
        new winston.transports.Console()
    ]
});

module.exports = logger;