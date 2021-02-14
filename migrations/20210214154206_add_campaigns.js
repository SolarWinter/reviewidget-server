
exports.up = async function(knex) {
  await knex.schema.createTable("campaigns", t => {
    t.increments("id").primary();

    t.integer("site_id").unsigned().notNullable();
    t.foreign("site_id").references("id").inTable("sites").onDelete("CASCADE");

    t.string("reviewSiteUrl").notNullable();
    t.string("reviewSiteName").notNullable();
    t.integer("reviewThreshold").notNullable();
    t.string("thankText").notNullable();

    t.boolean("active").defaultsTo(false);
    t.datetime("start").notNullable();
    t.datetime("finish").notNullable();

    t.timestamps(false, true);
  });

  return knex.schema.table("sites", t => {
    t.dropColumn("reviewSiteUrl");
    t.dropColumn("reviewSiteName");
    t.dropColumn("reviewThreshold");
    t.dropColumn("thankText");
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('campaigns');

  return knex.schema.table("sites", t => {
    t.string("reviewSiteUrl").notNullable();
    t.string("reviewSiteName").notNullable();
    t.integer("reviewThreshold").notNullable();
    t.string("thankText").notNullable();
  });
};
