// Update with your config settings.

module.exports = {

  development: {
    client: 'pg',
    connection: "postgres://postgres:postgres@localhost:5432/reviewidget_dev",
    ssl: {
      rejectUnauthorized: false
    }
  },

  staging: {
    client: 'pg',
    connection: "postgres://postgres:postgres@localhost:5432/reviewidget_staging",
    ssl: {
      rejectUnauthorized: false
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  },

  production: {
    client: 'pg',
    connection: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  }

};
