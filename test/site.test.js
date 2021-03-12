'use strict';

const chai = require("chai");
const expect = chai.expect;

const HTMLParser = require("node-html-parser");

const { init } = require("../lib/server");
const { dbCleanAndSeed } = require("./fixtures");

const newSiteData = {
  domain: "example.com",
  active: true
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
    expect(sites[0].id).to.equal("site-1");
    expect(sites[1].id).to.equal("site-2");
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
    expect(sites[0].id).to.equal("site-1");
    expect(sites[1].id).to.equal("site-2");
    // There's a site belonging to another user, so we don't get site-3.
    expect(sites[2].id).to.equal("site-4");
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

  it("gets 404 for a site that doesn't exist", async () => {
    await dbCleanAndSeed();

    const res = await server.inject({ url: "/sites/65535",
      auth: { strategy: "session", credentials: { id: 1 } }})
    expect(res.statusCode).to.equal(404);
  })

  it("can't add a new site with no domain", async () => {
    await dbCleanAndSeed();

    let siteDataCopy = Object.assign({}, newSiteData);
    delete (siteDataCopy.domain);
    const res = await server.inject({
      method: "post", url: "/sites/add",
      auth: { strategy: "session", credentials: { id: 1 } },
      payload: { ...siteDataCopy }
    });
    expect(res.statusCode).to.equal(200);
  });

  it("can't add a new site with no active value", async () => {
    await dbCleanAndSeed();

    let siteDataCopy = Object.assign({}, newSiteData);
    delete (siteDataCopy.active);
    const res = await server.inject({
      method: "post", url: "/sites/add",
      auth: { strategy: "session", credentials: { id: 1 } },
      payload: { ...siteDataCopy }
    });
    expect(res.statusCode).to.equal(200);
  });
})
