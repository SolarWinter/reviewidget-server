
exports.up = function(knex) {
  return knex.schema.createTable("users", t => {
    t.increments("id").primary();
    t.string("email").notNullable();
    t.string("passwordHash").notNullable();
    t.timestamps(false, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('users')
};
