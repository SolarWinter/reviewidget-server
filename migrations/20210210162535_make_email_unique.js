exports.up = function(knex) {
  return knex.schema.table("users", t => {
    t.unique("email");
  });
};

exports.down = function(knex) {
  return knex.schema.table("users", t => {
    t.dropUnique("email");
  });
};
