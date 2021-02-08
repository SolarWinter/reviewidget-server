
exports.seed = function(knex) {
  // Deletes ALL existing entries
  return knex('reviews').del()
    .then(function () {
      // Inserts seed entries; assuming seed site is in as 1.
      return knex('reviews').insert([
        {site_id: 1, domain: 'localhost', rating: 5, remoteIp: "127.0.0.1"}
      ]);
    });
};
