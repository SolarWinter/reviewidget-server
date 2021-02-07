require("dotenv").config();
'use strict';

import Hapi from "@hapi/hapi";
import { Server, Request } from "@hapi/hapi";
import Vision from "@hapi/vision";
import Nunjucks from "nunjucks";
// import hapipino from "hapi-pino";
import laabr from "laabr";

import { dbMigrate, getUserById, getUserByEmailAndPassword } from "./queries";

import { reviewRoutes } from "./reviews";

const production: boolean = (process.env.NODE_ENV === "production");

async function registerVision(server: Server) {
  server.views({
    engines: {
      html: {
        compile: (src, options) => {
          const template = Nunjucks.compile(src, options.environment);
          return (context) => {
            return template.render(context);
          };
        },
        prepare: (options, next) => {
          options.compileOptions.environment = Nunjucks.configure(options.path, { watch: false });
          return next();
        }
      }
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

  server.auth.strategy('session', 'cookie', {
    cookie: {
      name: 'reviewidget',
      password: process.env.COOKIE_SECRET,
      isSecure: production
    },
    redirectTo: '/login',
    validateFunc: async function (request: Request, session: any) {
      const account = await getUserById(request, session.id);
      if (!account) {
        return { valid: false };
      }
      return { valid: true, credentials: account };
    }
  });
  server.auth.default('session');

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

  server.route([
    {
      method: "GET",
      path: "/",
      handler: (request, h) => {
        return h.view('index', { ...request.auth.credentials });
      }
    }
  ])

  server.route([
    {
      method: 'GET',
      path: '/login',
      options: {
        auth: {
          mode: 'try'
        },
        plugins: {
          'hapi-auth-cookie': {
            redirectTo: false
          }
        },
        handler: async (request, h) => {
          if (request.auth.isAuthenticated) {
            return h.redirect('/');
          }
          return h.view("login");
        }
      }
    },
    {
      method: 'POST',
      path: '/login',
      options: {
        auth: {
          mode: 'try'
        },
        handler: async (request, h) => {
          const { email, password } = request.payload;
          if (!email || !password) {
            return renderHtml.login('Missing username or password');
          }

          // Try to find user with given credentials
          const account = await getUserByEmailAndPassword(request, email, password)
          if (!account) {
            return h.view("login", { message: 'Invalid username or password' });
          } else {
            request.cookieAuth.set({ id: account.id });
            return h.redirect('/');
          }
        }
      }
    },
    {
      method: 'GET',
      path: '/logout',
      options: {
        handler: (request, h) => {
          request.cookieAuth.clear();
          return h.redirect('/');
        }
      }
    }
  ]);

  await dbMigrate(server);

  await server.start();
};

process.on('unhandledRejection', (err) => {
    console.log(err);
    process.exit(1);
});

init();
