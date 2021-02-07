require("dotenv").config();
'use strict';

import { Server, Request, ServerRoute } from "@hapi/hapi";

import { dbMigrate, getUserById, getUserByEmailAndPassword } from "./queries";

const production: boolean = (process.env.NODE_ENV === "production");

export function registerAuth(server: Server) {
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
}

export const authRoutes: ServerRoute[] = [
  {
    method: 'GET',
    path: '/signup',
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
        return h.view("signup");
      }
    }
  },
  {
    method: 'POST',
    path: '/signup',
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
        return h.view("signup");
      }
    }
  },

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
        // const { email, password } = request.payload;
        const o: any = request.payload;
        if (!o.email || !o.password) {
          return h.view("signup");
        }

        // Try to find user with given credentials
        const account = await getUserByEmailAndPassword(request, o.email, o.password)
        if (account) {
          return h.view("login");
        } else {
          // TODO add to database
          request.cookieAuth.set({ id: account.id });
          return h.redirect('/');
        }
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
        // const { email, password } = request.payload;
        const o: any = request.payload;
        if (!o.email || !o.password) {
          return h.view("login");
        }

        // Try to find user with given credentials
        const account = await getUserByEmailAndPassword(request, o.email, o.password)
        if (!account) {
          return h.view("login");
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
];