import { Logger } from 'winston'
import { IConfig } from 'config'
import { Server } from './server'
import { Database } from './database'
import { RabbitMQService } from './rabbitMQ'
import { RedisClient } from './redis'

export class API {
  public logger: Logger
  private config: IConfig
  private database: Database
  private server: Server
  private rabbitMQService: RabbitMQService
  private redisClient: RedisClient
  private isRunning: boolean

  constructor(config: IConfig, logger: Logger) {
    this.config = config
    this.logger = logger.child({ context: 'api' })
    this.isRunning = false

    this.redisClient = new RedisClient(this.config, this.logger)
    this.database = new Database(this.config, this.logger)
    this.rabbitMQService = new RabbitMQService()
    this.server = new Server(
      this.config,
      this.logger,
      this.database,
      this.rabbitMQService,
      this.redisClient,
    )
  }

  async start() {
    if (this.isRunning) {
      throw new Error('Cannot start API because it is already running')
    }

    this.isRunning = true

    this.logger.verbose('Starting API')
    await this.database.connect()
    await this.rabbitMQService.initialize()
    await this.server.listen()
    this.logger.verbose('API ready and awaiting requests')

    return {
      url: this.config.get('server.url'),
    }
  }

  stop() {
    if (!this.isRunning) {
      throw new Error('Cannot stop API because it is already stopped')
    }

    this.isRunning = false

    this.logger.verbose('Stopping API')
    this.redisClient.disconnect()
    this.rabbitMQService.disconnect()
    this.server.disconnect()
    this.database.disconnect()
  }
}
