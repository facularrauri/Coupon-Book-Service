import throng from 'throng'
import figlet from 'figlet'
import { startCodeGenerationWorker } from './code-generator'
import { RabbitMQService } from '@/lib/rabbitMQ'
import { logger } from '@/logger'
import config from 'config'
import { Database } from '@/lib/database'
import pkg from '../../../package.json'

const RABBIT_WORKERS = Number(process.env.RABBIT_CONCURRENCY) || 1

throng({
  lifetime: Number.POSITIVE_INFINITY,
  count: RABBIT_WORKERS,
  master: () => {
    logger.verbose('Started master process for RabbitMQ workers')
  },
  worker: async (workerId, disconnect) => {
    logger.verbose(`Started RabbitMQ worker ${workerId}`)

    process.stdout.write('\n')
    process.stdout.write(`${figlet.textSync(`COUPON MQ`, { font: 'Ogre' })}\n`)
    process.stdout.write('\n')
    process.stdout.write(`RabbitMQ Worker: ${workerId}, Version: ${pkg.version || '1.0.0'}\n`)
    process.stdout.write('\n')

    const database = new Database(config, logger)
    const rabbitMQService = new RabbitMQService()

    const shutdown = () => {
      logger.verbose(`Worker ${workerId} cleanup.`)
      database.disconnect()
      disconnect()
    }

    try {
      await database.connect()
      logger.info(`RabbitMQ Worker ${workerId}: Connected to MongoDB`)

      await rabbitMQService.initialize()
      logger.info(`RabbitMQ Worker ${workerId}: RabbitMQ initialized succesfully`)

      await startCodeGenerationWorker(rabbitMQService, database)
      logger.info(`RabbitMQ Worker ${workerId}: Code Generator Worker initialized`)
    } catch (error) {
      logger.error(`RabbitMQ Worker ${workerId}: Error initializing rabbit service:`, error)

      shutdown()
    }

    process.once('SIGTERM', () => shutdown)
    process.once('SIGINT', () => shutdown)
  },
})
