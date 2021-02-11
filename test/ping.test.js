'use strict';

const chai = require("chai");
const expect = chai.expect;

const { init } = require("../lib/server");
const { dbClose } = require("../lib/queries");

describe('GET /', () => {
  let server;

  beforeEach((done) => {
    init().then(s => { server = s; done(); });
  })
  afterEach((done) => {
    server.stop().then(() => done());
  });
  
  it('ping responds with 200', async () => {
    const res = await server.inject({
      method: 'get',
      url: '/ping'
    });
    expect(res.statusCode).to.equal(200);
    expect(res.result.message).to.not.be.undefined;
    expect(res.result.message).to.equal("PONG");
  });
});
