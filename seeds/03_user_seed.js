require("dotenv").config();
const Bcrypt = require('bcrypt');

exports.seed = function(knex) {
  // Deletes ALL existing entries
  return knex('users').del()
    .then(async function () {
      // Inserts seed entries
      hash = await Bcrypt.hash("Sherlock", parseInt(process.env.BCRYPT_SALT_ROUNDS));
      return knex('users').insert([
        {email: 'johnwatson@bakerstreet.com', passwordHash: hash},
      ]);
    });
};
