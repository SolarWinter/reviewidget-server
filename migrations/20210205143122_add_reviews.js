
exports.up = function(knex) {
  return knex.schema.createTable("reviews", t => {
    t.increments("id").primary();
    t.string("domain").notNullable();
    t.integer("rating").notNullable();
    t.string("remoteIp").notNullable();
    t.timestamps(false, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('reviews')
};
