
exports.seed = function(knex) {
  // Deletes ALL existing entries
  return knex('sites').del()
    .then(async function () {
      let firstId = await knex("users").first(["id"]).where({ email: 'johnwatson@bakerstreet.com' });
      let secondId = await knex("users").first(["id"]).where({ email: 'nerowolfe@brownstone.com' });
      return knex('sites').insert([
        { user_id: firstId.id, domain: "localhost", reviewSiteName: "Google", reviewSiteUrl: "https://www.google.com/", reviewThreshold: 5, thankText: "Thanks a Googley-bunch!", active: true},
        { user_id: firstId.id, domain: "widget.lvh.me", reviewSiteName: "Bing!", reviewSiteUrl: "https://www.bing.com/", reviewThreshold: 5, thankText: "Thanks a Bingy-bunch!", active: true},
        { user_id: secondId.id, domain: "192.168.0.200", reviewSiteName: "DDG", reviewSiteUrl: "https://www.duckduckgo.com/", reviewThreshold: 5, thankText: "Quack!", active: true}
      ]);
    });
};
