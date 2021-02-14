const moment = require("moment");

exports.seed = function(knex) {
  // Deletes ALL existing entries
  return knex('campaigns')
    .del()
    .then(async function () {
      now = moment()
      console.log("now", now);
      console.log("start", now.subtract(14, 'days').toDate());
      console.log("finish", now.subtract(7, 'days').toDate());
      localhostId = await knex("sites").first(["id"]).where({ domain: 'localhost' });
      widgetId = await knex("sites").first(["id"]).where({ domain: 'widget.lvh.me' });
      ipId = await knex("sites").first(["id"]).where({ domain: '192.168.0.200' });
      // Inserts seed entries
      return knex('campaigns').insert([
        {
          // 'localhost' - current, active
          site_id: localhostId.id,
          active: true,
          start: now.toDate(),
          finish: now.add(7, 'days').toDate(),
          reviewSiteName: "Google",
          reviewSiteUrl: "https://www.google.com/",
          reviewThreshold: 5,
          thankText: "Thanks a Googley-bunch!",
        },
        {
          // 'widget.lvh.me' - future, active
          site_id: widgetId.id,
          active: true,
          start: now.add(7, 'days').toDate(),
          finish: now.add(14, 'days').toDate(),
          reviewSiteName: "Bing!",
          reviewSiteUrl: "https://www.bing.com/",
          reviewThreshold: 5,
          thankText: "Thanks a Bingy-bunch!",
        },
        {
          // 'widget.lvh.me' - past, active
          site_id: widgetId.id,
          active: true,
          start: now.subtract(14, 'days').toDate(),
          finish: now.subtract(7, 'days').toDate(),
          reviewSiteName: "DDG",
          reviewSiteUrl: "https://www.duckduckgo.com/",
          reviewThreshold: 5,
          thankText: "Quack!",
        },
        {
          // '192.168.0.200' - current, inactive
          site_id: ipId.id,
          active: false,
          start: now.toDate(),
          finish: now.add(7, 'days').toDate(),
          reviewSiteName: "Yelp!",
          reviewSiteUrl: "https://www.yelp.co.uk/",
          reviewThreshold: 4,
          thankText: "Yelp!"
        }
      ]);
    });
};
