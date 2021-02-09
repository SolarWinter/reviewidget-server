exports.up = function(knex) {
  return knex.schema.table("reviews", t => {
    t.integer("site_id").unsigned()
    t.foreign("site_id").references("id").inTable("sites").onDelete("CASCADE");
  });
};

exports.down = function(knex) {
  return knex.schema.table("reviews", t => {
    t.dropColumn("site_id");
  });
};
