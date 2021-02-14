'use strict';

const chai = require("chai");
const expect = chai.expect;

const { init } = require("../lib/server");
const { dbCleanAndSeed } = require("../lib/queries");

describe("review", () => {
  let server;

  beforeEach(async () => {
    server = await init();
  })
  afterEach(async () => {
    await server.stop();
  });

  it("gives correct data for valid site entry", async () => {
    await dbCleanAndSeed();

    let res = await server.inject({ method: "GET", url: "/addReview?domain=localhost&rating=5" });
    expect(res.statusCode).to.equal(200);
    expect(res.result.reviewSiteUrl).to.equal('https://www.google.com/');
    expect(res.result.reviewSiteName).to.equal('Google');
    expect(res.result.reviewThreshold).to.equal(5);
    expect(res.result.thankText).to.equal('Thanks a Googley-bunch!');
  });

  it("returns 'not found' for invalid site entry", async () => {
    let res = await server.inject({ method: "GET", url: "/addReview?domain=wombatsvilleunited.com&rating=5" });
    expect(res.statusCode).to.equal(404);
    expect(res.result).to.be.null;
  });
});
