
exports.seed = function(knex) {
  // Deletes ALL existing entries
  return knex('reviews').del()
    .then(function () {
      // Inserts seed entries
      return knex('reviews').insert([
        {domain: 'localhost', rating: 5, remoteIp: "127.0.0.1"}
      ]);
    });
};
