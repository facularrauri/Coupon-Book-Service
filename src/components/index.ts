import { requireAll } from '../utils/requireAll'
import { convertToPascalCase } from '../utils/utils'

import { IRouteServices } from 'interfaces'

interface IRoutes {
  [key: string]: undefined | (new (services?: IRouteServices) => any)
}

const routes: IRoutes = {}

const components = requireAll({
  dirname: __dirname,
  filter: /(.+(?:model|route))\.(ts|js)$/i,
  recursive: true,
})

Object.keys(components).forEach((componentName) => {
  const moduleName = convertToPascalCase(componentName)

  const component = components[componentName]

  const route = component[`${componentName}.route`]?.[`${moduleName}Route`]

  if (route) routes[`${moduleName}Route`] = route
})

export * from './auth/middlewares/authentication'
export * from './auth/middlewares/authorization'
export * from './user/user.model'
export * from './role/role.model'
export * from './coupon/coupon.model'
export * from './coupon-book/coupon-book.model'
export * from './coupon/coupon.model'
export * from './user-coupon/user-coupon.model'
export * from './transaction/transaction.model'
export { routes }
