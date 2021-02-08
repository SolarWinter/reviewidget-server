require("dotenv").config();
'use strict';

import { Server, Request, ServerRoute } from "@hapi/hapi";

import { getUserById, getUserByEmail, getUserByEmailAndPassword } from "./queries";
import { createUser } from "./queries";

const production: boolean = (process.env.NODE_ENV === "production");

export function registerAuth(server: Server) {
  server.auth.strategy('session', 'cookie', {
    cookie: {
      name: 'reviewidget',
      password: process.env.COOKIE_SECRET,
      isSecure: production
    },
    redirectTo: '/login',
    appendNext: true,
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
          return h.redirect(request.query.next || "/");
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
          return h.redirect(request.query.next);
        }

        const o: any = request.payload;
        if (!o.email || !o.password) {
          return h.view("signup", 
                        { message: "You need to supply an email address and password" });
        }
        console.log("Finding user for email", o.email);
        const account = await getUserByEmail(request, o.email)
        if (!account) {
          console.log("request.query.next is", request.query.next);
          if (await createUser(request, o.email, o.password)) {
            return h.redirect("/login");
          } else {
            return h.view("signup", { message: "Sorry, an error occcurred." });
          }
        } else {
          console.log("Account already found with email", 
                      o.email, "redirecting to login");
          return h.redirect("/login");
        }
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
        if (request.auth.isAuthenticated) {
          return h.redirect(request.query.next || "/");
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
        const o: any = request.payload;
        if (!o.email || !o.password) {
          return h.view("login");
        }

        // Try to find user with given credentials
        const account = await getUserByEmailAndPassword(request, o.email, o.password)
        if (!account) {
          return h.view("login", { message: "email or password is wrong." });
        } else {
          request.cookieAuth.set({ id: account.id });
          request.log("debug", "Next is " + request.query.next);
          return h.redirect(request.query.next || "/");
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