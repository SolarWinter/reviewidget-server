// Update with your config settings.

module.exports = {

  development: {
    client: 'pg',
    connection: "postgres://postgres:postgres@localhost:5432/reviewidget_dev",
  },

  test: {
    client: 'pg',
    connection: "postgres://postgres:postgres@localhost:5432/reviewidget_test",
  },

  staging: {
    client: 'pg',
    connection: "postgres://postgres:postgres@localhost:5432/reviewidget_staging",
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
    connection: process.env.DATABASE_URL + "?ssl=true&sslmode=no-verify",
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  }

};
