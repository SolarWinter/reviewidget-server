const knexCleaner = require("knex-cleaner");

const { database, dbClose } = require("../lib/queries");

exports.mochaGlobalTeardown = async function() {
  return dbClose();
};

/* Used for testing */
// TODO Do better than unknown
exports.dbClean = async function() {
  const options = { ignoreTables: ["knex_migrations", "knex_migrations_lock"] };
  // Ignoring the knexCleaner line because of https://github.com/steven-ferguson/knex-cleaner/issues/42
  // @ts-ignore
  return knexCleaner.clean(database, options);
}

// TODO Do better than unknown
exports.dbCleanAndSeed = async function () {
  const options = { ignoreTables: ["knex_migrations", "knex_migrations_lock"] };
  // Ignoring the knexCleaner line because of https://github.com/steven-ferguson/knex-cleaner/issues/42
  // @ts-ignore
  await knexCleaner.clean(database, options);
  return database.seed.run();
}
