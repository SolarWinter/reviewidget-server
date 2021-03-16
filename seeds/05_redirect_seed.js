const iplocate = require("node-iplocate");

function ensureInt(i) {
  if (typeof i == "string") {
    i = parseInt(i);
  }
  return i;
}


async function insertRow(db, campaignId, remoteIp) {
  let geoIpData;
  if (process.env.NODE_ENV == "test") {
    const geoIpDataBlocks = [
      { "ip": "216.58.212.228", "asn": "AS15169", "org": "GOOGLE", "city": "Mountain View", "country": "United States", "latitude": 37.4043, "continent": "North America", "longitude": -122.0748, "time_zone": "America/Los_Angeles", "postal_code": "94043", "subdivision": "California", "country_code": "US", "subdivision2": null },
      { "ip": "68.183.255.165", "asn": "AS14061", "org": "DIGITALOCEAN-ASN", "city": "London", "country": "United Kingdom", "latitude": 51.5353, "continent": "Europe", "longitude": -0.6658, "time_zone": "Europe/London", "postal_code": "SL1", "subdivision": "England", "country_code": "GB", "subdivision2": null },
      { "ip": "199.232.36.81", "asn": "AS54113", "org": "FASTLY", "city": "New York", "country": "United States", "latitude": 40.7126, "continent": "North America", "longitude": -74.0066, "time_zone": "America/New_York", "postal_code": "10118", "subdivision": "New York", "country_code": "US", "subdivision2": null }
    ]
    geoIpData = geoIpDataBlocks.find(rec => rec.ip == remoteIp);
  } else {
    geoIpData = await iplocate(remoteIp);
  }
  return db.insert({ campaign_id: campaignId, remoteIp: remoteIp, geoIpData: geoIpData});
}

exports.seed = function(knex) {
  // Deletes ALL existing entries
  return knex('redirects')
    .del()
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
