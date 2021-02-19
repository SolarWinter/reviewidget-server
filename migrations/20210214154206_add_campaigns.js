
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
  /* Has to be done in several phases; add the columns as nullable... */
  await knex.schema.alterTable("sites", t => {
    t.string("reviewSiteUrl").nullable();
    t.string("reviewSiteName").nullable();
    t.integer("reviewThreshold").nullable();
    t.string("thankText").nullable();
  });

  /* ...copy data from campaign columns to sites... */
  const data = await knex.table("campaigns")
                         .select(["site_id","reviewSiteUrl","reviewSiteName","reviewThreshold","thankText"]);
  for (row of data) {
    const tmp_id = row.site_id;
    delete row.site_id;
    console.log("Updating 'sites'", tmp_id, "with data", row);
    await knex("sites").where({ id: tmp_id }).update(row);
  }

  /* ... then make them not nullable. */
  await knex.schema.alterTable("sites", t => {
    t.string("reviewSiteUrl").notNullable().alter();
    t.string("reviewSiteName").notNullable().alter();
    t.integer("reviewThreshold").notNullable().alter();
    t.string("thankText").notNullable().alter();
  });

  /* Then drop the campaigns table. (Finally.) */
  return knex.schema.dropTableIfExists('campaigns');
};
