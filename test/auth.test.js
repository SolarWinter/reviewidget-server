'use strict';

const Lab = require('@hapi/lab');
const { expect } = require("@hapi/code");
const HTMLParser = require("node-html-parser");

const { afterEach, beforeEach, describe, it } = exports.lab = Lab.script();

const { init } = require("../lib/server");
const { dbClean, dbCleanAndSeed } = require("../lib/queries");

function isLoginPage(htmlText) {
  const html = HTMLParser.parse(htmlText);
  const title = html.querySelector("title");
  return title.innerText === "Login page";
}

describe("auth tests", () => {
  let server;

  beforeEach(async () => {
    server = await init();
  })
  afterEach(async () => {
    await server.stop();
  });

  it("can't login as non-existing user", async () => {
    await dbClean();

    let res = await server.inject({
      method: "POST", url: "/login?next=/sites",
      payload: { email: "johnwatson@bakerstreet.com", password: "Sherlock"
    }});
    expect(res.statusCode).to.equal(200);
    expect("res.headers.set-cookie").to.be.undefined;
  });

  it("can't login as existing user with wrong password", async () => {
    await dbCleanAndSeed();

    let res = await server.inject({
      method: "POST", url: "/login?next=/sites",
      payload: { email: "johnwatson@bakerstreet.com", password: "WrongPassword"
    }});
    expect(isLoginPage(res.result)).to.be.true;
    expect(res.statusCode).to.equal(200);
    expect("res.headers.set-cookie").to.be.undefined;
  });

  it("can't access protected page if not logged in", async () => {
    let res = await server.inject("/sites");
    expect(res.statusCode).to.equal(302);
    expect(res.headers.location).to.equal("/login?next=%2Fsites");
    expect("res.headers.set-cookie").to.be.undefined;
  });
});
