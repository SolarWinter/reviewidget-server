'use strict';

const chai = require("chai");
const expect = chai.expect;

const HTMLParser = require("node-html-parser");

const { init } = require("../lib/server");
const { dbCleanAndSeed } = require("../lib/queries");

const newSiteData = {
  domain: "example.com",
  reviewSiteName: "Google",
  reviewSiteUrl: "https://www.google.co.uk/",
  reviewThreshold: "4",
  thankText: "Thanks Google-bot",
};

describe("site tests", () => {
  let server;

  beforeEach(async () => {
    server = await init();
  })
  afterEach(async () => {
    await server.stop();
  });

  it("can get the sites page", async () => {
    await dbCleanAndSeed();

    const res = await server.inject({ method: "get", url: "/sites",
      auth: { strategy: "session", credentials: { id: 1 } }
    });
    expect(res.statusCode).to.equal(200);
    const html = HTMLParser.parse(res.result);
    const sites = html.querySelectorAll("div.site-entry");
    expect(sites.length).to.equal(2);
    expect(sites[0].id == "site-1");
    expect(sites[1].id == "site-2");
  });

  it("get the 'add a new site page'", async () => {
    await dbCleanAndSeed();

    const res = await server.inject({
      method: "get", url: "/sites/add",
      auth: { strategy: "session", credentials: { id: 1 } }
    });
    expect(res.statusCode).to.equal(200);
  });

  it("add a new site", async () => {
    await dbCleanAndSeed();

    const res = await server.inject({
      method: "post", url: "/sites/add",
      auth: { strategy: "session", credentials: { id: 1 } },
      payload: { ...newSiteData }
    });
    expect(res.statusCode).to.equal(302);
    expect(res.headers.location).to.include("/sites/");
  });

  it("add a site and see it on the sites page", async () => {
    await dbCleanAndSeed();

    let res = await server.inject({
      method: "post", url: "/sites/add",
      auth: { strategy: "session", credentials: { id: 1 } },
      payload: { ...newSiteData }
    });
    expect(res.statusCode).to.equal(302);
    expect(res.headers.location).to.include("/sites/");

    res = await server.inject({
      method: "get", url: "/sites",
      auth: { strategy: "session", credentials: { id: 1 } }
    });
    expect(res.statusCode).to.equal(200);
    const html = HTMLParser.parse(res.result);
    const sites = html.querySelectorAll("div.site-entry");
    expect(sites.length).to.equal(3);
    expect(sites[0].id == "site-1");
    expect(sites[1].id == "site-2");
    expect(sites[2].id == "site-3");
  });

  it("can't add a new site with no creds", async () => {
    await dbCleanAndSeed();

    const res = await server.inject({
      method: "post", url: "/sites/add",
      payload: { ...newSiteData }
    });
    expect(res.statusCode).to.equal(302);
    expect(res.headers.location).to.equal("/login?next=%2Fsites%2Fadd");
  });
})