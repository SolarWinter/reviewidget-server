require("dotenv").config();
'use strict';

import Hapi from "@hapi/hapi";
import { Request } from "@hapi/hapi";
import hapipino from "hapi-pino";
// import laabr from "laabr";

function handleReview(request: Request) {
  request.log(["trace"], "handleReview in");
  const rating = request.query.rating;
  const domain = request.query.domain;
  request.log(["review", "rating"], `Received rating ${rating} for ${domain}`);
  return { message: "wibble" };
}

const init = async () => {
  const server = Hapi.server({
    port: process.env.PORT,
    host: '0.0.0.0'
  });

  /* Plugins need to finish registration before server can start. */
  await server.register({
    plugin: hapipino,
    options: {
      prettyPrint: process.env.NODE_ENV !== "production"
    }
  });
  // await server.register({ plugin: laabr, options: {} });

  server.route({
    method: "GET",
    path: "/ping",
    handler: function(request, _h) {
      request.log(["debug"], "PING received");
      server.log(["debug"], "PING received");
      return { message: "PONG" };
    }
  });

  server.route({
    method: "GET",
    path: "/addReview",
    handler: handleReview
  });

  await server.start();
};

process.on('unhandledRejection', (err) => {

    console.log(err);
    process.exit(1);
});

init();
