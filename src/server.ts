require("dotenv").config();
'use strict';

import Hapi from "@hapi/hapi";
import { Server } from "@hapi/hapi";
import Path from "path";

let hapipino: any, laabr: any;
if (process.env.NODE_ENV === "production") {
  hapipino = require("hapi-pino");
} else  {
  laabr = require("laabr");
}

import { dbMigrate, dbClose } from "./queries";
import { reviewRoutes } from "./reviews";
import { authRoutes, registerAuth } from "./auth";
import { siteRoutes } from "./sites";

export let server: Server;

const production: boolean = (process.env.NODE_ENV === "production");

declare module '@hapi/hapi' {
  interface Request {
    cookieAuth: any
  }
};

async function registerVision(server: Server) {
  server.views({
    engines: { ejs: require("ejs")},
    relativeTo: __dirname + "/../",
    path: 'templates'
  });
}

/* Plugins need to finish registration before server can start. */
async function registerServerPlugins(server: Server) {
  if (production) {
    await server.register({
      plugin: hapipino,
      options: {
        prettyPrint: !production
      }
    });
  } else {
    await server.register({ plugin: laabr, options: {} });
  }
  await server.register(require("@hapi/cookie"));
  await server.register(require("@hapi/vision"));
  await server.register(require('@hapi/inert'));
}

export const init = async () => {
  server = Hapi.server({
    port: process.env.PORT,
    host: '0.0.0.0'
    // , debug: { log: ["*"], request: ["*"] }
  });

  await registerServerPlugins(server);
  await registerVision(server);

  registerAuth(server);

  server.route({
    method: "GET",
    path: "/ping",
    options: {
      auth: {
        mode: 'try'
      }
    },
    handler: function(request, _h) {
      request.log(["debug"], "PING received");
      server.log(["debug"], "PING received");
      return { message: "PONG" };
    }
  });

  server.route(reviewRoutes);
  server.route(authRoutes);
  server.route(siteRoutes);

  server.route({
    method: "GET",
    path: "/static/{param*}",
    options: {
      auth: {
        mode: 'try'
      }
    },
    handler: {
      directory: {
        path: Path.join(__dirname, "../static/")
      }
    }
  });

  server.route([
    {
      method: "GET",
      path: "/",
      handler: (request, h) => {
        return h.view('index', { ...request.auth.credentials });
      }
    }
  ])

  server.events.on("stop", () => {
    // We want it to close in dev or when running in production;
    // when testing the server is started and stopped a lot, so
    // we'll do it manually then.
    if (process.env.NODE_ENV != "test") {
      dbClose();
    }
  })

  await dbMigrate(server);
  return server;
};

export const start = async () => {
  return server.start();
};

process.on('unhandledRejection', (err) => {
    console.log(err);
    process.exit(1);
});
