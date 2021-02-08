require("dotenv").config();
const Bcrypt = require('bcrypt');

exports.seed = function(knex) {
  // Deletes ALL existing entries
  return knex('users').del()
    .then(async function () {
      // Inserts seed entries
      return knex('users').insert([
        {email: 'johnwatson@bakerstreet.com', passwordHash: Bcrypt.hashSync("Sherlock", parseInt(process.env.BCRYPT_SALT_ROUNDS))},
        {email: 'nerowolfe@brownstone.com', passwordHash: Bcrypt.hashSync("Satisfactory", parseInt(process.env.BCRYPT_SALT_ROUNDS))},
      ]);
    });
};
