'use strict';

const chai = require("chai");
const expect = chai.expect;

const { init } = require("../lib/server");
const { dbClean, dbCleanAndSeed } = require("../lib/queries");
const { isLoginSignupPage } = require("./utils");

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
    isLoginSignupPage(res.result);
  });

  it("can get the signup page", async () => {
    const res = await server.inject({ method: "get", url: "/signup" });
    expect(res.statusCode).to.equal(200);
    isLoginSignupPage(res.result);
  });

  it("can create a new user and login", async () =>{
    await dbClean();

    let res = await server.inject({
      method: "POST", url: "/signup",
      payload: { email: "johnwatson@bakerstreet.com", password: "Sherlock"
    }});
    expect(res.statusCode).to.equal(302);
    // Check that after signup we redirect them to login
    expect(res.headers.location).to.equal("/login");

    res = await server.inject({
      method: "POST", url: "/login?next=/sites",
      payload: { email: "johnwatson@bakerstreet.com", password: "Sherlock"
    }});
    expect(res.statusCode).to.equal(302);
    expect(res.headers.location).to.equal("/sites");
    expect(res.headers["set-cookie"]).to.not.be.undefined;
  });

  it("can login to an existing user", async () => {
    await dbCleanAndSeed();
    const res = await server.inject({
      method: "POST", url: "/login?next=/sites",
      payload: { email: "johnwatson@bakerstreet.com", password: "Sherlock"
    }});
    expect(res.statusCode).to.equal(302);
    expect(res.headers.location).to.equal("/sites");
    expect(res.headers["set-cookie"]).to.not.be.undefined;
  });

  it("redirected from the login page when already logged in", async () => {
    await dbCleanAndSeed();

    let res = await server.inject({
      method: "POST", url: "/login?next=/sites",
      payload: { email: "johnwatson@bakerstreet.com", password: "Sherlock"
    }});
    expect(res.statusCode).to.equal(302);
    expect(res.headers.location).to.equal("/sites");
    expect(res.headers["set-cookie"]).to.not.be.undefined;

    res = await server.inject({
      method: "GET", url: "/login?next=/sites",
      auth: { strategy: "session", credentials: { id: 1 }}
    });
    expect(res.statusCode).to.equal(302);
    expect(res.headers.location).to.equal("/sites");
  });

  it("redirected back to index from the login page after logging in", async () => {
    await dbCleanAndSeed();

    let res = await server.inject({
      method: "POST", url: "/login",
      payload: { email: "johnwatson@bakerstreet.com", password: "Sherlock"
    }});
    expect(res.statusCode).to.equal(302);
    expect(res.headers.location).to.equal("/");
    expect(res.headers["set-cookie"]).to.not.be.undefined;
  });

  it("redirected from the signup page when already logged in", async () => {
    await dbCleanAndSeed();

    let res = await server.inject({
      method: "POST", url: "/login?next=/sites",
      payload: { email: "johnwatson@bakerstreet.com", password: "Sherlock"
    }});
    expect(res.statusCode).to.equal(302);
    expect(res.headers.location).to.equal("/sites");
    expect(res.headers["set-cookie"]).to.not.be.undefined;

    res = await server.inject({
      method: "GET", url: "/signup?next=/sites",
      auth: { strategy: "session", credentials: { id: 1 } }
    });
    expect(res.statusCode).to.equal(302);
    expect(res.headers.location).to.equal("/sites");
  });
});
