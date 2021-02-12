'use strict';

const chai = require("chai");
const expect = chai.expect;

const HTMLParser = require("node-html-parser");

const { init } = require("../lib/server");
const { dbClean, dbCleanAndSeed } = require("../lib/queries");
const { isLoginSignupPage } = require("./utils");

describe("auth tests", () => {
  let server;

  beforeEach(async () => {
    server = await init();
  })
  afterEach(async () => {
    await server.stop();
  });

  it("can't login as non-existing user", async function() {
    await dbClean();

    let res = await server.inject({
      method: "POST", url: "/login?next=/sites",
      payload: { email: "johnwatson@bakerstreet.com", password: "Sherlock"
    }});
    expect(res.statusCode).to.equal(200);
    expect(res.headers["set-cookie"]).to.be.undefined;
  });

  it("can't login as existing user with wrong password", async function() {
    await dbCleanAndSeed();

    let res = await server.inject({
      method: "POST", url: "/login?next=/sites",
      payload: { email: "johnwatson@bakerstreet.com", password: "WrongPassword"
    }});
    expect(res.statusCode).to.equal(200);
    isLoginSignupPage(res.result, "Login page");
    expect(res.headers["set-cookie"]).to.be.undefined;
  });

  it("can't access protected page if not logged in", async function() {
    let res = await server.inject("/sites");
    expect(res.statusCode).to.equal(302);
    expect(res.headers.location).to.equal("/login?next=%2Fsites");
    expect(res.headers["set-cookie"]).to.be.undefined;
    // To actually get the login page we'd have to issue another GET to
    // headers.location - no point we already test the login page works. 
  });
});
