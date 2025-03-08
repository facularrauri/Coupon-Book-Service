import config from 'config'
import throng from 'throng'
import figlet from 'figlet'
import pkg from '../../../package.json'

import { logger } from '@/logger'
import { API } from '@/lib/'

const WORKERS = Number(process.env.WEB_CONCURRENCY) || 1

throng({
  lifetime: Infinity,
  count: WORKERS,
  master: () => {
    logger.verbose('Started master.')
  },
  worker: async (workerId, disconnect) => {
    logger.verbose(`Started worker ${workerId}`)

    process.stdout.write('\n')
    process.stdout.write(`${figlet.textSync(`API`, { font: 'Ogre' })}\n`)
    process.stdout.write('\n')
    process.stdout.write(`Worker: ${workerId}, Version: ${pkg.version}\n`)
    process.stdout.write('\n')
    process.stdout.write('\n')

    const api = new API(config, logger)

    api
      .start()
      .then((result) => {
        logger.info(`API server instance created and started`)
        logger.info(`Listening for HTTP requests at ${result.url}`)
      })
      .catch((err) => {
        logger.error(`Failed to start API server`, err)
      })

    const shutdown = () => {
      logger.verbose(`Worker ${workerId} cleanup.`)
      api.stop()
      disconnect()
    }

    process.once('SIGTERM', shutdown)
    process.once('SIGINT', shutdown)
  },
})
