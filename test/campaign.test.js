'use strict';

const { describe, it, beforeEach, afterEach } = require("mocha");
const { expect } = require("chai");
const moment = require("moment");

const HTMLParser = require("node-html-parser");

const { init } = require("../lib/server");
const { dbCleanAndSeed, dbClean } = require("./fixtures");

const now = moment();

const newCampaignData = {
  site_id: 1,
  reviewSiteName: "Google",
  reviewSiteUrl: "https://www.google.co.uk/",
  reviewThreshold: "4",
  thankText: "Thanks Google-bot",
	start: now.add(7, 'days').toDate(),
  finish: now.add(14, 'days').toDate(),
  active: true
};

describe("campaign tests", async () => {
  let server;

  beforeEach(async () => {
    server = await init();
  })
  afterEach(async () => {
    await server.stop();
  });

  it("can get the campaigns page", async () => {
    await dbCleanAndSeed();

    const res = await server.inject({ method: "get", url: "/campaigns",
      auth: { strategy: "session", credentials: { id: 1 } }
    });
    expect(res.statusCode).to.equal(200);
    const html = HTMLParser.parse(res.result);
    const campaigns = html.querySelectorAll("div.campaign-entry");
    expect(campaigns.length).to.equal(3);
    expect(campaigns[0].id).to.equal("campaign-1");
    expect(campaigns[1].id).to.equal("campaign-2");
    expect(campaigns[2].id).to.equal("campaign-3");
  })

  it("get the 'add a new campaign page'", async () => {
    await dbCleanAndSeed();

    const res = await server.inject({
      method: "get", url: "/campaigns/add",
      auth: { strategy: "session", credentials: { id: 1 } }
    });
    expect(res.statusCode).to.equal(200);
  });

	it("add a campaign and see it on the campaigns page", async () => {
    await dbCleanAndSeed();

    let res = await server.inject({
      method: "post", url: "/campaigns/add",
      auth: { strategy: "session", credentials: { id: 1 } },
      payload: { ...newCampaignData }
    });
    expect(res.statusCode).to.equal(302);
    expect(res.headers.location).to.include("/campaigns/");

    res = await server.inject({
      method: "get", url: "/campaigns",
      auth: { strategy: "session", credentials: { id: 1 } }
    });
    expect(res.statusCode).to.equal(200);
    const html = HTMLParser.parse(res.result);
    const campaigns = html.querySelectorAll("div.campaign-entry");
    expect(campaigns.length).to.equal(4);
    expect(campaigns[0].id).to.equal("campaign-1");
    expect(campaigns[1].id).to.equal("campaign-2");
    expect(campaigns[2].id).to.equal("campaign-3");
    // Not 4, as there's a campaign belonging to another user.
    expect(campaigns[3].id).to.equal("campaign-5");
  });

  it.skip("is possible to edit a campaign", async () => {
    await dbCleanAndSeed();

    let res = await server.inject({
      method: "post", url: "/campaigns/add",
      auth: { strategy: "session", credentials: { id: 1 } },
      payload: { ...newCampaignData }
    });
    console.log("res", res);
    expect(res.statusCode).to.equal(302);
    const campaignUrl = res.headers.location;
    console.log("campaignUrl", campaignUrl);

    res = await server.inject({
      method: "get", url: campaignUrl,
      auth: { strategy: "session", credentials: { id: 1 } },
      payload: { ...newCampaignData }
    });
    console.log("res.result", res.result);
    expect(res.statusCode).to.equal(200);
    const html = HTMLParser.parse(res.result);
    const threshold = html.querySelector("reviewThreshold");
    expect(threshold).to.not.be.null;
    console.log("threshold", threshold);
  })
})

describe("campaign negative tests", async () => {
  let server;

  beforeEach(async () => {
    server = await init();
  })
  afterEach(async () => {
    await server.stop();
  });

	it("can't add a new campaign with no creds", async () => {
    await dbCleanAndSeed();

    const res = await server.inject({
      method: "post", url: "/campaigns/add",
      payload: { ...newCampaignData }
    });
    expect(res.statusCode).to.equal(302);
    expect(res.headers.location).to.equal("/login?next=%2Fcampaigns%2Fadd");
  });

  it("gets 404 for a campaign that doesn't exist", async () => {
    await dbCleanAndSeed();

    const res = await server.inject({ url: "/campaigns/65535",
      auth: { strategy: "session", credentials: { id: 1 } }})
    expect(res.statusCode).to.equal(404);
  })

  it("can't create a campaign with no start date", async () => {
    await dbCleanAndSeed();

    let campaignDataCopy = Object.assign({}, newCampaignData);
    delete (campaignDataCopy.start);
    let res = await server.inject({
      method: "post", url: "/campaigns/add",
      auth: { strategy: "session", credentials: { id: 1 } },
      payload: { ...campaignDataCopy }
    });
    expect(res.statusCode).to.equal(200);
  })

  it("can't create a campaign with no finish date", async () => {
    await dbCleanAndSeed();

    let campaignDataCopy = Object.assign({}, newCampaignData);
    delete (campaignDataCopy.finish);
    let res = await server.inject({
      method: "post", url: "/campaigns/add",
      auth: { strategy: "session", credentials: { id: 1 } },
      payload: { ...campaignDataCopy }
    });
    expect(res.statusCode).to.equal(200);
  })

  it("can't delete a campaign that isn't ours", async () => {
    await dbCleanAndSeed();

    let res = await server.inject({
      method: "delete", url: "/campaigns/3",
      auth: { strategy: "session", credentials: { id: 1 } }
    });
    expect(res.statusCode).to.equal(404);
  })

  it("doesnt' crash on deleting a non-existent campaign", async () => {
    await dbCleanAndSeed();

    let res = await server.inject({
      method: "delete", url: "/campaigns/1024",
      auth: { strategy: "session", credentials: { id: 1 } }
    });
    expect(res.statusCode).to.equal(404);
  })
})
