
exports.seed = function(knex) {
  // Deletes ALL existing entries
  return knex('sites').del()
    .then(async function () {
      let firstId = await knex("users").first(["id"]).where({ email: 'johnwatson@bakerstreet.com' });
      let secondId = await knex("users").first(["id"]).where({ email: 'nerowolfe@brownstone.com' });
      return knex('sites').insert([
        { domain: "localhost", user_id: firstId.id, active: true, alias: "00abcdef", verified: true},
        { domain: "widget.lvh.me", user_id: firstId.id, active: true, alias: "f00ff00f", verified: true},
        { domain: "192.168.0.200", user_id: secondId.id, active: true, alias: "aa00bb00", verified: true}
      ]);
    });
};
