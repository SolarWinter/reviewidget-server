exports.up = function(knex) {
  return knex.schema.createTable("redirects", t => {
    t.increments("id").primary();
    t.string("remoteIp").notNullable();
    t.integer("site_id").unsigned()
    t.foreign("site_id").references("id").inTable("sites").onDelete("CASCADE");
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('redirects');
};
