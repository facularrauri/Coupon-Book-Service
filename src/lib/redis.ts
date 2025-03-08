import Redis from 'ioredis'
import { Logger } from 'winston'
import { IConfig } from 'config'

export class RedisClient {
  private client: Redis
  private config: IConfig
  private logger: Logger

  constructor(config: IConfig, logger: Logger) {
    this.config = config
    this.logger = logger.child({ context: 'Redis' })

    this.client = new Redis({
      host: this.config.get('redis.host'),
      port: this.config.get('redis.port'),
      password: this.config.get('redis.password'),
      retryStrategy: (times) => Math.min(times * 50, 2000),
    })

    this.client.on('connect', () => this.logger.verbose('Connected to Redis'))
    this.client.on('error', (err) => this.logger.error('Redis Error:', err))
  }

  async set(key: string, value: any, expireSeconds?: number) {
    try {
      const data = typeof value === 'object' ? JSON.stringify(value) : value
      const acquired = await this.client.set(key, data, 'NX')
      if (expireSeconds) {
        await this.client.expire(key, expireSeconds)
      }

      return acquired
    } catch (error) {
      this.logger.error('Redis SET Error:', error)
    }
  }

  async get(key: string) {
    try {
      const value = await this.client.get(key)
      if (value) {
        try {
          return JSON.parse(value)
        } catch {
          return value
        }
      }
    } catch (error) {
      this.logger.error('Redis GET Error:', error)
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key)
    } catch (error) {
      this.logger.error('Redis DEL Error:', error)
    }
  }

  async exists(key: string): Promise<boolean | undefined> {
    try {
      return (await this.client.exists(key)) === 1
    } catch (error) {
      this.logger.error('Redis EXISTS Error:', error)
    }
  }

  async expire(key: string, seconds: number): Promise<void> {
    try {
      await this.client.expire(key, seconds)
    } catch (error) {
      this.logger.error('Redis EXPIRE Error:', error)
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.client.quit()
      this.logger.verbose('Redis client disconnected')
    } catch (error) {
      this.logger.error('Redis Disconnect Error:', error)
    }
  }
}
