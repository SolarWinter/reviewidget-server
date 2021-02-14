
exports.seed = function(knex) {
  // Deletes ALL existing entries
  return knex('sites').del()
    .then(async function () {
      let firstId = await knex("users").first(["id"]).where({ email: 'johnwatson@bakerstreet.com' });
      let secondId = await knex("users").first(["id"]).where({ email: 'nerowolfe@brownstone.com' });
      return knex('sites').insert([
        { domain: "localhost", user_id: firstId.id, active: true},
        { domain: "widget.lvh.me", user_id: firstId.id, active: true},
        { domain: "192.168.0.200", user_id: secondId.id, active: true}
      ]);
    });
};
