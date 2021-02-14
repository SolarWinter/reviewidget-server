exports.seed = function(knex) {
  // Deletes ALL existing entries
  return knex('reviews').del()
    .then(async function () {
      // Inserts seed entries; assuming seed site is in as 1.
      let site_id = await knex("sites").first(["id"]).where({ domain: 'localhost' });
      return knex('reviews').insert([
        {site_id: site_id.id, domain: 'localhost', rating: 5, remoteIp: "127.0.0.1"}
      ]);
    });
};
