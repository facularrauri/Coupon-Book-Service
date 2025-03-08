import winston, { format, transports } from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'
import colors from 'colors'
import config from 'config'

const { combine, splat, timestamp, printf, colorize, metadata, json } = format

const logFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${colors.gray(timestamp)} [${level}]: ${message}`
  if (metadata) {
    const { context } = metadata

    if (context) msg = `${msg} context=${context} `
  }
  return msg
})

const logger = winston.createLogger({
  level: config.get('logger.console.level'),
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    metadata({ fillExcept: ['message', 'level', 'timestamp', 'label', 'context'] }),
  ),
  transports: [
    new transports.Console({
      format: combine(colorize(), splat(), logFormat),
    }),
    new DailyRotateFile({
      filename: 'logs/%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      format: combine(json()),
    }),
  ],
})

export { logger }
