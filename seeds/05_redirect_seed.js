const iplocate = require("node-iplocate");

function ensureInt(i) {
  if (typeof i == "string") {
    i = parseInt(i);
  }
  return i;
}

async function insertRow(db, campaignId, remoteIp) {
  const geoIpData = await iplocate(remoteIp);
  return db.insert({ campaign_id: campaignId, remoteIp: remoteIp, geoIpData: geoIpData});
}

exports.seed = function(knex) {
  // Deletes ALL existing entries
  return knex('redirects').del()
    .then(async function () {
      const db = knex("redirects");
      const localhostId = await knex("sites").first(["id"]).where({ domain: 'localhost' });
      const firstLocalCampaignId = await knex("campaigns").first(["id"]).where({ site_id: localhostId.id });
      const widgetId = await knex("sites").first(["id"]).where({ domain: 'widget.lvh.me' });
      const firstWidgetCampaignId = await knex("campaigns").first(["id"]).where({ site_id: widgetId.id });
      let promises = [
        insertRow(db, firstLocalCampaignId.id, "68.183.255.165"),
        insertRow(db, firstLocalCampaignId.id, "216.58.212.228"),
        insertRow(db, firstWidgetCampaignId.id, "199.232.36.81")
      ];
      return Promise.all(promises);
    });
};
