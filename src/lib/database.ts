import mongoose, { Mongoose, ConnectOptions } from 'mongoose'
import { Logger } from 'winston'
import { IConfig } from 'config'

export class Database {
  private mongoose: Mongoose
  private logger: Logger
  private config: IConfig

  constructor(config: IConfig, logger: Logger) {
    this.logger = logger.child({ context: 'Database' })
    this.config = config
    this.logger.verbose('Creating mongoose instance')
    this.mongoose = mongoose
    this.logger.verbose('Mongoose instance created')
  }

  public async connect(): Promise<void> {
    try {
      this.logger.verbose('Connecting to database')

      const options: ConnectOptions = {
        // replicaSet: 'rs0',
      }

      // if (this.config.mongo.certificate) {
      //   options.ssl = true
      //   options.sslCert = this.config.mongo.certificate
      //   options.sslKey = this.config.mongo.certificate
      // }

      await this.mongoose.connect(this.config.get('mongo.url'), options)
      this.logger.verbose('Connected to database')
    } catch (error) {
      this.logger.error('Unable to connect to the database:', error)
    }
  }

  async disconnect() {
    this.logger.verbose('Disconnecting from database')
    await this.mongoose.disconnect()
    this.logger.verbose('Disconnected from database')
  }

  model(model: string) {
    return this.mongoose.model(model)
  }

  async ping() {
    if (!this.mongoose.connection.db) {
      return Promise.reject(new Error('Not connected to database'))
    }
    return this.mongoose.connection.db.admin().ping()
  }

  startSession() {
    return this.mongoose.startSession()
  }
}

// export const database = new Database(config, logger)
