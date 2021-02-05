import { Server } from "@hapi/hapi";

const connection = require('../knexfile')[process.env.NODE_ENV || "development"];
const database = require('knex')(connection)

export function getAllSites() {
  return database('sites');
}

export function getSite(site: string) {
  return database
          .from("sites")
          .where("domain","=",site);
}

export function addReview(site: string, rating: number, remote: string) {
  return database
          .from("reviews")
          .insert({ domain: site, rating: rating, remoteIp: remote });
}

export async function dbMigrate(server: Server) {
  const [_completed, pending] = await database.migrate.list();
  if (pending.length > 0) {
    server.log(["database"], "Pending migrations:");
    server.log(["database"], pending);
  } else {
    server.log(["database"], "Server migrations up to date")
  }

  return database.migrate.latest();
}