'use strict';

const Lab = require('@hapi/lab');
const { expect } = require("@hapi/code");
const HTMLParser = require("node-html-parser");

const { afterEach, beforeEach, describe, it } = exports.lab = Lab.script();

const { init } = require("../lib/server");
const { dbClean, dbCleanAndSeed } = require("../lib/queries");

describe("user tests", () => {
  let server;

  beforeEach(async () => {
    server = await init();
  })
  afterEach(async () => {
    await server.stop();
  });

  it("can get the login page", async () => {
    const res = await server.inject({ method: "get", url: "/login" });
    expect(res.statusCode).to.equal(200);
    const html = HTMLParser.parse(res.result);
    const inputs = html.querySelectorAll("input");
    expect(inputs.length).to.equal(3);
  });

  it("can get the signup page", async () => {
    const res = await server.inject({ method: "get", url: "/signup" });
    expect(res.statusCode).to.equal(200);
    const html = HTMLParser.parse(res.result);
    const inputs = html.querySelectorAll("input");
    expect(inputs.length).to.equal(3);
  });

  it("can create a new user and login", async () =>{
    await dbClean();

    let res = await server.inject({
      method: "POST", url: "/signup",
      payload: { email: "johnwatson@bakerstreet.com", password: "Sherlock"
    }});
    expect(res.statusCode).to.equal(302);
    expect(res.headers.location).to.equal("/login");

    res = await server.inject({
      method: "POST", url: "/login?next=/sites",
      payload: { email: "johnwatson@bakerstreet.com", password: "Sherlock"
    }});
    expect(res.statusCode).to.equal(302);
    expect(res.headers.location).to.equal("/sites");
    expect("res.headers.set-cookie").to.not.be.undefined;
  });

  it("can login to an existing user", async () => {
    await dbCleanAndSeed();
    const res = await server.inject({
      method: "POST", url: "/login?next=/sites",
      payload: { email: "johnwatson@bakerstreet.com", password: "Sherlock"
    }});
    expect(res.statusCode).to.equal(302);
    expect(res.headers.location).to.equal("/sites");
    expect("res.headers.set-cookie").to.not.be.undefined;
  });

  it("redirected from the login page when already logged in", async () => {
    let loginCookie;

    await dbCleanAndSeed();

    let res = await server.inject({
      method: "POST", url: "/login?next=/sites",
      payload: { email: "johnwatson@bakerstreet.com", password: "Sherlock"
    }});
    expect(res.statusCode).to.equal(302);
    expect(res.headers.location).to.equal("/sites");
    expect("res.headers.set-cookie").to.not.be.undefined;
    loginCookie = res.headers["set-cookie"];

    res = await server.inject({
      method: "GET", url: "/login?next=/sites",
      auth: { strategy: "session", credentials: loginCookie }
    });
    expect(res.statusCode).to.equal(302);
    expect(res.headers.location).to.equal("/sites");
  });

  it("redirected from the signup page when already logged in", async () => {
    let loginCookie;

    await dbCleanAndSeed();

    let res = await server.inject({
      method: "POST", url: "/login?next=/sites",
      payload: { email: "johnwatson@bakerstreet.com", password: "Sherlock"
    }});
    expect(res.statusCode).to.equal(302);
    expect(res.headers.location).to.equal("/sites");
    expect("res.headers.set-cookie").to.not.be.undefined;
    loginCookie = res.headers["set-cookie"];

    res = await server.inject({
      method: "GET", url: "/signup?next=/sites",
      auth: { strategy: "session", credentials: loginCookie }
    });
    expect(res.statusCode).to.equal(302);
    expect(res.headers.location).to.equal("/sites");
  });
});
