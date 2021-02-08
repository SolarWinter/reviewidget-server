'use strict';

const Lab = require('@hapi/lab');
const { expect } = require("@hapi/code");

const { afterEach, beforeEach, describe, it } = exports.lab = Lab.script();

const { init } = require("../lib/server");

describe('GET /', () => {
  let server;

  beforeEach(async () => {
    server = await init();
  });

  afterEach(async () => {
    await server.stop();
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
