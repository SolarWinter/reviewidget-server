
exports.up = function(knex) {
  return knex.schema.createTable('sites', t => {
    t.increments("id").primary();

    t.string("domain").notNullable();
    t.string("reviewSiteUrl").notNullable();
    t.string("reviewSiteName").notNullable();
    t.integer("reviewThreshold").notNullable();
    t.string("thankText").notNullable();
    t.boolean("active").defaultsTo(false);

    t.timestamps(false, true);

    t.index("domain");
  })
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('sites')
};
