require("dotenv").config();
'use strict';

import Hapi from "@hapi/hapi";
import { Server, Request } from "@hapi/hapi";
import Vision from "@hapi/vision";
import Ejs = require("ejs");
// import hapipino from "hapi-pino";
import laabr from "laabr";

import { dbMigrate } from "./queries";

import { reviewRoutes } from "./reviews";
import { authRoutes, registerAuth } from "./auth";

const production: boolean = (process.env.NODE_ENV === "production");

declare module '@hapi/hapi' {
  interface Request {
    cookieAuth: any
  }
};

async function registerVision(server: Server) {
  server.views({
    engines: {
      ejs: Ejs
      // html: {
      //   compile: (src: string, options: MyCompileOptions) => {
      //     console.log("html->compile");
      //     console.log("options", options);
      //     const template = Nunjucks.compile(src, options.environment);
      //     return (context: any) => {
      //       return template.render(context);
      //     };
      //   },
      //   prepare: (options: MyCompileOptions, next) => {
      //     console.log("html->prepare");
      //     console.log("options", options);
      //     console.log("next", next);
      //     options.compileOptions.environment = Nunjucks.configure(options.path, { watch: false });
      //     return next();
      //   }
      // }
    },
    relativeTo: __dirname,
    path: 'templates'
  });
}

/* Plugins need to finish registration before server can start. */
async function registerServerPlugins(server: Server) {
  // await server.register({
  //   plugin: hapipino,
  //   options: {
  //     prettyPrint: !production
  //   }
  // });
  await server.register({ plugin: laabr, options: {} });
  await server.register(require("@hapi/cookie"));
  await server.register(Vision);
}

const init = async () => {
  const server = Hapi.server({
    port: process.env.PORT,
    host: '0.0.0.0'
  });

  await registerServerPlugins(server);
  await registerVision(server);

  registerAuth(server);

  server.route({
    method: "GET",
    path: "/ping",
    handler: function(request, _h) {
      request.log(["debug"], "PING received");
      server.log(["debug"], "PING received");
      return { message: "PONG" };
    }
  });

  server.route(reviewRoutes);
  server.route(authRoutes);

  server.route([
    {
      method: "GET",
      path: "/",
      handler: (request, h) => {
        return h.view('index', { ...request.auth.credentials });
      }
    }
  ])

  server.route({
    method: "GET",
    path: "/sites",
    handler: (request, h) => {
      return h.view("sites", { sites: [ { name: "Hello", location: "world" }] });
    }
  })

  await dbMigrate(server);

  await server.start();
};

process.on('unhandledRejection', (err) => {
    console.log(err);
    process.exit(1);
});

init();
