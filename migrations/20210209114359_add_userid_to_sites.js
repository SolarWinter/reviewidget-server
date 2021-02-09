exports.up = function(knex) {
  return knex.schema.table("sites", t => {
    t.integer("user_id").unsigned();

    t
      .foreign("user_id")
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
  });
};

exports.down = function(knex) {
  return knex.schema.table("sites", t => {
    t.dropColumn("user_id");
  });
};
