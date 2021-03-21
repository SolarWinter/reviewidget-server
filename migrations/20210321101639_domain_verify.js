require("dotenv").config();

const uuid = require("uuid/v4");

exports.up = async function(knex) {
  await knex.schema.alterTable('sites', t => {
    t.string("alias");
    t.boolean("verified").defaultsTo(false);
  });

  const sites = await knex("sites");

  let promises = [];
  sites.forEach(site => {
    console.log("Site", site);
    promises.push(knex("sites")
                    .where({ id: site.id })
                    .update({ alias: uuid().substr(0,8) }));
  })
  await Promise.all(promises);

  return await knex.schema.alterTable('sites', t => {
    t.string("alias").notNullable().alter();
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('sites', t => {
    t.dropColumn("alias");
    t.dropColumn("verified");
  });
};
