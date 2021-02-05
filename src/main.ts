require("dotenv").config();
'use strict';

import Hapi from "@hapi/hapi";
import { Request } from "@hapi/hapi";
import hapipino from "hapi-pino";
// import laabr from "laabr";

import { getSite, addReview, dbMigrate } from "./queries";

async function handleReview(request: Request) {
  const rating = request.query.rating;
  const domain = request.query.domain;
  const remoteIp = request.info.remoteAddress;

  request.log(["debug", "review"], `Received rating ${rating} for ${domain} from ${remoteIp}`);
  await addReview(domain, rating, remoteIp);

  let data = await getSite(domain);
  // TODO randomise if we get an array
  if (data.length >= 1) {
    data = data[0];
  }

  if (data.active) {
    const returnData = {
      reviewSiteUrl: data.reviewSiteUrl,
      reviewSiteName: data.reviewSiteName,
      reviewThreshold: data.reviewThreshold,
      thankText: data.thankText
    };
    request.log(["info"], returnData)
    return returnData;
  } else {
    return { thankText: data.thankText };
  }
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
    handler: handleReview,
    options: {
      cors: {
        origin: ['*']
      }
    }
  });

  await dbMigrate(server);

  await server.start();
};

process.on('unhandledRejection', (err) => {

    console.log(err);
    process.exit(1);
});

init();
