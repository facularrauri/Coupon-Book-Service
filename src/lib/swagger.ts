import swaggerUi from 'swagger-ui-express'
import swaggerJsdoc from 'swagger-jsdoc'
import { validationMetadatasToSchemas } from 'class-validator-jsonschema'
import { IConfig } from 'config'
import { Express } from 'express'

export class Swagger {
  private config: IConfig
  private app: Express

  constructor(config: IConfig, app: Express) {
    this.config = config
    this.app = app

    this._setupSwagger()
  }

  _setupSwagger() {
    const options = {
      swaggerDefinition: {
        openapi: '3.0.0',
        info: {
          title: 'API',
          version: '1.0.0',
          description: 'API documentation for endpoints',
        },
        components: {
          schemas: validationMetadatasToSchemas(),
          securitySchemes: {
            BearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
            },
          },
        },
        security: [
          {
            BearerAuth: [],
          },
        ],
        externalDocs: {
          description: 'swagger.json',
          url: '/swagger.json',
        },
        servers: [
          {
            url: this.config.get('server.url'),
          },
        ],
      },
      apis: ['src/components/**/*.@(js|ts)'],
    }

    const specs = swaggerJsdoc(options)
    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs))
    this.app.get('/swagger.json', (req, res) => {
      res.setHeader('Content-Type', 'application/json')
      res.send(specs)
    })
  }
}
