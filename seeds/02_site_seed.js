
exports.seed = function(knex) {
  // Deletes ALL existing entries
  return knex('sites').del()
    .then(function () {
      return knex('sites').insert([
        { user_id: 1, domain: "localhost", reviewSiteName: "Google", reviewSiteUrl: "https://www.google.com/", reviewThreshold: 5, thankText: "Thanks a Googley-bunch!", active: true},
        { user_id: 1, domain: "widget.lvh.me", reviewSiteName: "Bing!", reviewSiteUrl: "https://www.bing.com/", reviewThreshold: 5, thankText: "Thanks a Bingy-bunch!", active: true},
        { user_id: 2, domain: "192.168.0.200", reviewSiteName: "DDG", reviewSiteUrl: "https://www.duckduckgo.com/", reviewThreshold: 5, thankText: "Quack!", active: true}
      ]);
    });
};
