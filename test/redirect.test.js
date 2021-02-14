'use strict';

const chai = require("chai");
const expect = chai.expect;

const { init } = require("../lib/server");
const { dbCleanAndSeed } = require("../lib/queries");

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

    let res = await server.inject({ method: "GET", url: "/redirect?domain=localhost" });
    expect(res.statusCode).to.equal(302);
    expect(res.headers.location).to.equal("https://www.google.com/");
  });

  it("returns 'not found' for invalid site entry", async () => {
    let res = await server.inject({ method: "GET", url: "/redirect?domain=wombatsvilleunited.com" });
    expect(res.statusCode).to.equal(404);
  });
});
