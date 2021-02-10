import { Request, Server } from "@hapi/hapi";
import bcrypt from "bcrypt";
import knexCleaner from "knex-cleaner";

const connection = require('../knexfile')[process.env.NODE_ENV || "development"];
const database = require('knex')(connection);

export interface Site {
  user_id: number;
  domain: string;
  reviewSiteName: string;
  reviewSiteUrl: string;
  reviewThreshold: number;
  thankText: string;
  active: boolean;
};

function ensureInt(i : number | string) : number {
  if (typeof i == "string") {
    i = parseInt(i);
  }
  return i;
}

export function getAllSites() {
  return database('sites');
}

// Used only for getting review data so we can supply it to the widget
export function getSiteByDomain(site: string) {
  return database
    .select()
    .from("sites")
    .where({ domain: site });
}

export function getSitesForUser(userId: number | string) {
  userId = ensureInt(userId);
  return database
    .select()
    .from("sites")
    .where({ user_id: userId });
};

export function getSiteById(siteId: number | string, userId: number | string) {
  siteId = ensureInt(siteId);
  userId = ensureInt(userId);
  return database
    .first()
    .from("sites")
    .where({ id: siteId, user_id: userId });
};

export function addReview(site: string, rating: number, remote: string) {
  return database
    .from("reviews")
    .insert({ domain: site, rating: rating, remoteIp: remote }, ["id"]);
}

export async function dbMigrate(server: Server) {
  const [completed, pending] = await database.migrate.list();
  server.log(["database", "debug"], `Completed ${completed.length} migrations.`);
  if (pending.length > 0) {
    server.log(["database"], "Pending migrations:");
    server.log(["database"], pending);
  } else if (process.env.NODE_ENV != "test") {
    server.log(["database", "debug"], "Server migrations up to date")
  }

  return database.migrate.latest();
}

export async function getUserById(_request: Request, userId: number) {
  const account = await database
    .first()
    .from("users")
    .where({ id: userId });
  if (account) {
    delete account.passwordHash;
  }
  return Promise.resolve(account);
}

export async function getUserByEmail(_request: Request, email: string) {
  let account = await database
    .first()
    .from("users")
    .where({ email: email });
  if (account) {
    delete account.passwordHash;
  }
  return Promise.resolve(account);
}

export async function getUserByEmailAndPassword(_request: Request, email: string, password: string) {
  let account = await database
    .first()
    .from("users")
    .where({ email: email });
  if (account) {
    if (await bcrypt.compare(password, account.passwordHash)) {
      delete account.passwordHash;
    } else {
      account = null;
    }
  }

  return Promise.resolve(account);
}

export async function createUser(request: Request, email: string, password: string) {
  request.log(["users"], `Creating user ${email}`);
  const hash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_SALT_ROUNDS!));
  const result = await database("users").insert({ email: email, passwordHash: hash }, ["id"]);
  if (result.length == 1) {
    return Promise.resolve(result[0].id);
  } else {
    console.error("result", result);
    return Promise.reject("couldn't add user");
  }
}

export async function createSite(request: Request, siteDetails: Site) {
  request.log(["sites"], "Creating site" + siteDetails);
  const result = await database("sites").insert(siteDetails, ["id"]);
  if (result.length == 1) {
    return Promise.resolve(result[0].id);
  } else {
    console.error("result", result);
    return Promise.reject("couldn't add site");
  }
}

export async function deleteSite(request: Request, siteId: number | string, userId: number | string) {
  siteId = ensureInt(siteId);
  userId = ensureInt(userId);
  request.log(["sites"], `Deleting site ${siteId} for ${userId}`);
  const result = await database("sites")
    .where({ id: siteId, user_id: userId })
    .returning("id")
    .del();

  if (result.length == 1 && result[0] == siteId) {
    return Promise.resolve();
  } else {
    return Promise.reject({ message: "Error deleting site" });
  }
}

export async function updateSite(_request: Request, siteId: number | string, siteDetails: Site) {
  siteId = ensureInt(siteId);
  const result = await database("sites")
    .where({ id: siteId })
    .returning("id")
    .update(siteDetails);

  if (result.length == 1 && result[0] == siteId) {
    return Promise.resolve(result[0]);
  } else {
    return Promise.reject({ message: "Error updating site" });
  }
}

/* Used for testing */
export async function dbClean() {
  const options = { ignoreTables: ["knex_migrations", "knex_migrations_lock"] };
  return knexCleaner.clean(database, options);
}

export async function dbCleanAndSeed() {
  // TODO add check for TEST env?
  const options = { ignoreTables: ["knex_migrations", "knex_migrations_lock"] };
  await knexCleaner.clean(database, options);
  return database.seed.run();
}
