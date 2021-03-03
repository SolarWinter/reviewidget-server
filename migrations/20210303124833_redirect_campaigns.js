
exports.up = function(knex) {
  return knex.schema.alterTable('redirects', t => {
    t.dropColumn("site_id");
    t.integer("campaign_id");
    t.foreign("campaign_id").references("id").inTable("campaigns").onDelete("CASCADE");
    t.jsonb("geoIpData");
    t.timestamps(false, true);
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('redirects', t => {
    t.dropColumns(["campaign_id", "geoIpData"]);
    t.integer("site_id");
    t.foreign("site_id").references("id").inTable("sites").onDelete("CASCADE");
    t.dropTimestamps();
  });
};
