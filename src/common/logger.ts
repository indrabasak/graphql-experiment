const { createLogger, format, transports } = require('winston');

const { combine, json, splat, timestamp } = format;

const logLevel = process.env.LOG_LEVEL || 'info';
export const appLogger = createLogger({
  level: process.env.NODE_DEBUG ? 'debug' : logLevel,
  format: combine(timestamp(), splat(), json()),
  transports: [new transports.Console()],
  defaultMeta: {
    service: 'sage',
    region: process.env.AWS_REGION,
    type: 'lambda',
    process: process.env.AWS_LAMBDA_FUNCTION_NAME,
    env: process.env.APP_ENVIRONMENT
  }
});
