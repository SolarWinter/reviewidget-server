require("dotenv").config();
const Bcrypt = require('bcrypt');

exports.seed = function(knex) {
  // Deletes ALL existing entries
  return knex('users').del()
    .then(async function () {
      // Inserts seed entries
      hash = await Bcrypt.hash("Sherlock", 10);
      return knex('users').insert([
        {email: 'johnwatson@bakerstreet.com', passwordHash: hash},
      ]);
    });
};
