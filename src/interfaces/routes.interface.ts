import { Database } from '@/lib/database'
import { RabbitMQService } from '@/lib/rabbitMQ'
import { RedisClient } from '@/lib/redis'
import { Router } from 'express'
// import { Mailer } from '../lib/mailer'

export interface IRoute {
  path: string
  router: Router
}

export interface IRouteServices {
  database: Database
  rabbitMQService: RabbitMQService
  redisClient: RedisClient
}
