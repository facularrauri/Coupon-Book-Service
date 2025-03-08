import amqp from 'amqplib'
import { logger } from '@/logger'
import { Logger } from 'winston'
import config from 'config'

export const QUEUES = {
  CODE_GENERATION: 'coupon-service.code-generation',
}

export class RabbitMQService {
  private url: string
  private connection: amqp.ChannelModel | null
  private channel: amqp.Channel | null
  private reconnectTimeout: NodeJS.Timeout | null
  private isConnecting: boolean
  private consumers: Map<any, any>
  private logger: Logger

  constructor() {
    this.logger = logger.child({ context: 'RabbitMQ' })
    this.url = config.get('rabbit.url')
    this.connection = null
    this.channel = null
    this.reconnectTimeout = null
    this.isConnecting = false
    this.consumers = new Map()
  }

  async initialize() {
    if (this.isConnecting) {
      return
    }

    this.isConnecting = true

    try {
      this.connection = await amqp.connect(this.url)

      this.connection.on('close', () => {
        logger.verbose('Conexión a RabbitMQ cerrada. Intentando reconectar...')
        this.connection = null
        this.channel = null

        if (this.reconnectTimeout) {
          clearTimeout(this.reconnectTimeout)
        }

        this.reconnectTimeout = setTimeout(() => {
          this.isConnecting = false
          this.initialize().catch((err) =>
            this.logger.error('Error trying to reconnect RabbitMQ:', err),
          )
        }, 5000)
      })

      this.connection.on('error', (err) => {
        this.logger.error('Error on connection RabbitMQ:', err)
        if (this.connection) {
          this.connection
            .close()
            .catch((closeErr) => this.logger.error('Error closing connection RabbitMQ:', closeErr))
        }
      })

      this.channel = await this.connection.createChannel()

      await Promise.all(
        Object.values(QUEUES).map((queue) => this.channel?.assertQueue(queue, { durable: true })),
      )

      if (this.consumers.size > 0) {
        logger.verbose(`Restaurando ${this.consumers.size} consumidores...`)
        for (const [queue, callback] of this.consumers.entries()) {
          await this._setupConsumer(queue, callback)
        }
      }

      this.isConnecting = false
      this.logger.verbose('RabbitMQ connected')
    } catch (error) {
      this.logger.error('Error init RabbitMQ:', error)

      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout)
      }

      logger.verbose('Reconnecting rabbitMQ')
      this.reconnectTimeout = setTimeout(() => {
        this.isConnecting = false
        this.initialize().catch((err) => this.logger.error('Error reconnecting RabbitMQ:', err))
      }, 5000)

      throw error
    }
  }

  async ensureConnection() {
    if (!this.connection || !this.channel) {
      await this.initialize()
    }
  }

  async publishMessage(queue: string, message: any) {
    try {
      await this.ensureConnection()

      const success = this.channel?.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
        persistent: true,
      })

      return success
    } catch (error) {
      this.logger.error(`Error publishing queue messages ${queue}:`, error)
      throw error
    }
  }

  async _setupConsumer(queue: string, callback: (msg: any) => void) {
    await this.channel?.prefetch(1)

    await this.channel?.consume(queue, async (msg) => {
      if (!msg) return

      try {
        const content = JSON.parse(msg.content.toString())
        await callback(content)
        this.channel?.ack(msg)
      } catch (error) {
        this.logger.error(`Error processing queue messages ${queue}:`, error)
        this.channel?.nack(msg, false, true)
      }
    })

    this.logger.info(`Consumer registered for queue: ${queue}`)
  }

  async consumeMessages(queue: string, callback: (msg: any) => void) {
    try {
      await this.ensureConnection()

      this.consumers.set(queue, callback)

      await this._setupConsumer(queue, callback)
    } catch (error) {
      this.logger.error(`Error consuming queue messages ${queue}:`, error)
      throw error
    }
  }

  async disconnect() {
    try {
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout)
        this.reconnectTimeout = null
      }

      this.consumers.clear()

      if (this.channel) {
        await this.channel.close()
        this.channel = null
      }

      if (this.connection) {
        await this.connection.close()
        this.connection = null
      }

      logger.verbose('Connection closed')
    } catch (error) {
      this.logger.error('Error closing connection RabbitMQ:', error)
      throw error
    }
  }
}
