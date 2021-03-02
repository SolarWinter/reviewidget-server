
exports.up = function(knex) {
  return knex.schema.alterTable('sites', t => {
    t.unique("domain");
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('sites', t => {
    t.dropUnique("domain");
  });
};
