const { it, afterEach, beforeEach, describe } = require("mocha");
const chai = require("chai");
const expect = chai.expect;

const { init } = require("../lib/server");
const { dbCleanAndSeed } = require("./fixtures");
const { database } = require("../lib/queries");

describe("redirect", () => {
  let server;

  beforeEach(async () => {
    server = await init();
  })
  afterEach(async () => {
    await server.stop();
  });

  it("gives correct redirect for valid site entry", async () => {
    await dbCleanAndSeed();
    const localhostId = await database("sites").first(["id"]).where({ domain: 'localhost' });
    const campaignId = await database("campaigns").first(["id"]).where({ site_id: localhostId.id });

    let res = await server.inject({ method: "GET", url: "/redirect?domain=localhost&campaignId=" + campaignId.id });
    expect(res.statusCode).to.equal(302);
    expect(res.headers.location).to.equal("https://www.google.com/");
  });

  it("returns 'not found' for valid site entry with invalid campaign ID", async () => {
    let res = await server.inject({ method: "GET", url: "/redirect?domain=localhost&campaignId=65535" });
    expect(res.statusCode).to.equal(404);
  });

  it("returns 'not found' for invalid site entry", async () => {
    let res = await server.inject({ method: "GET", url: "/redirect?domain=wombatsvilleunited.com" });
    expect(res.statusCode).to.equal(404);
  });
});
