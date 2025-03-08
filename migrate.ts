export default {
  uri: 'mongodb://mongodb-service/api?replicaSet=rs0',
  collection: 'migrations',
  migrationsPath: './migrations',
  templatePath: './migrations/template.ts',
  autosync: true,
}
