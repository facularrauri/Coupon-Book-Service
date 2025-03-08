import ms from 'ms'
import cors from 'cors'
import http from 'http'
import helmet from 'helmet'
import express, { Express, NextFunction, Request, Response } from 'express'
import onFinished from 'on-finished'
import expressBodyParser from 'body-parser'
import rateLimit from 'express-rate-limit'
import prettyMs from 'pretty-ms'
import pkg from '../../package.json'
import cookieParser from 'cookie-parser'
import { boolParser } from '../middlewares/queryBoolean'
import { requestID } from '../middlewares/requestID'

import { IConfig } from 'config'
import { Logger } from 'winston'

import { routes } from '../components'

import { IRequest, IRoute } from '../interfaces'

import { errorHandler } from '../middlewares/errorHandler'
import { Swagger } from './swagger'
import { RabbitMQService } from './rabbitMQ'
import { Database } from './database'
import { RedisClient } from './redis'

export class Server {
  private config: IConfig
  private logger: Logger
  private _httpServer: http.Server
  private app: Express
  private routes: IRoute[]
  private database: Database
  private rabbitMQService: RabbitMQService
  private redisClient: RedisClient

  constructor(
    config: IConfig,
    logger: Logger,
    database: Database,
    rabbitMQService: RabbitMQService,
    redisClient: RedisClient,
  ) {
    this.logger = logger.child({ context: 'Server' })
    this.database = database
    this.rabbitMQService = rabbitMQService
    this.redisClient = redisClient
    this.config = config
    this.routes = []

    this.logger.verbose('Creating express app and HTTP server instance')
    this.app = express()
    this._httpServer = http.createServer(this.app)
    this.logger.verbose('Express app and HTTP server instance created')

    this.app.set('trust proxy', 1)

    this._initSwaggerServer()
    this._setupExpressMiddleware()
    this._initRoutes()
    this._setupExpressRoutes()
    this._setupErrorHandler()
  }

  async listen() {
    this.logger.verbose('Attempting to bind HTTP server to %s', this.config.get('server.url'))
    return new Promise<void>((resolve, reject) => {
      this._httpServer
        .listen(process.env.PORT || this.config.get('server.port'))
        .once('listening', () => {
          this.logger.verbose('HTTP server bound')
          resolve()
        })
        .once('error', (err: any) => {
          reject(err)
        })
    })
  }

  disconnect() {
    this._httpServer.closeAllConnections()
  }

  private _setupExpressMiddleware() {
    const requestLogger = () => (_req: Request, res: Response, next: NextFunction) => {
      const req = _req as IRequest
      req._startTime = Date.now()
      req.logger = this.logger.child({})

      const headers = { ...req.headers }
      delete headers.authorization

      req.logger.info('Incoming request', {
        httpVersion: req.httpVersion,
        method: req.method,
        url: req.url,
        trailers: req.trailers,
        requestId: req.id,
        headers,
      })

      onFinished(res, () => {
        req.logger.info('Outgoing response', {
          user: req.user ? req.user.sub : 'unauthenticated',
          httpVersion: req.httpVersion,
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
          requestId: req.id,
          duration: prettyMs(Date.now() - req._startTime),
        })
      })

      next(null)
    }

    const requestQuery = () => (_req: Request, res: Response, next: NextFunction) => {
      const req = _req as IRequest

      req.sort = req.query.sort as string
      req.populate = req.query.populate as string
      req.offset = req.query.offset ? parseInt(String(req.query.offset), 10) : 0
      req.limit = req.query.limit
        ? Math.min(parseInt(String(req.query.limit), 10), this.config.get('server.maxResultsLimit'))
        : this.config.get('server.maxResultsLimit')
      req.select = req.query.select as string | string[]

      delete req.query.sort
      delete req.query.offset
      delete req.query.limit
      delete req.query.select
      delete req.query.populate

      next(null)
    }

    this.logger.verbose('Attaching middleware to express app')
    this.app.use(requestID())
    this.app.use(helmet())
    this.app.use(cookieParser())
    this.app.use(cors({ origin: this.config.get('cors.whitelist') }))
    this.app.use(
      rateLimit({
        windowMs: Number(ms(this.config.get('rateLimit.window'))),
        max: parseInt(this.config.get('rateLimit.requests'), 10),
      }),
    )
    this.app.use(expressBodyParser.raw())
    this.app.use(expressBodyParser.json({ limit: '50mb' }))
    this.app.use(expressBodyParser.urlencoded({ extended: true }))
    this.app.use(boolParser())
    this.app.use(requestQuery())
    this.app.use(requestLogger())

    this.logger.verbose('Middleware attached')
  }

  private _initSwaggerServer() {
    this.logger.verbose('Initializing swagger server')
    new Swagger(this.config, this.app)
  }

  private _initRoutes() {
    this.logger.verbose('Initializing routes')

    for (const key in routes) {
      const Route = routes[key]
      if (typeof Route === 'function') {
        this.routes.push(
          new Route({
            database: this.database,
            rabbitMQService: this.rabbitMQService,
            redisClient: this.redisClient,
          }),
        )
      }
    }
  }

  private async _setupExpressRoutes() {
    this.logger.verbose('Attaching resource routers to express app')

    this.app.get('/', (_: Request, res: Response) =>
      res.send({ name: pkg.name, version: pkg.version }),
    )

    this.routes.forEach((route) => {
      this.app.use(route.path, route.router)
    })

    this.logger.verbose('Resource routers attached')
  }

  private _setupErrorHandler() {
    this.logger.verbose('Attaching error handler')
    this.app.use((err: Error, req: Request, res: Response, next: NextFunction) =>
      errorHandler(err, req as IRequest, res, next),
    )
    this.logger.verbose('Error handler attached')
  }
}
