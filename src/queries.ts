import { Request, Server } from "@hapi/hapi";
import bcrypt from "bcrypt";

const connection = require('../knexfile')[process.env.NODE_ENV || "development"];
const database = require('knex')(connection);

interface User {
  id: number;
  name: string;
  age: number;
}

export function getAllSites() {
  return database('sites');
}

export function getSite(site: string) {
  return database
    .select()
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

export async function getUserById(request: Request, userId: number) {
  const account = await database
    .first()
    .from("users")
    .where("id","=",userId);
  delete account.passwordHash;
  request.log("Got account", account);
  return Promise.resolve(account);
}

export async function getUserByEmail(request: Request, email: string) {
  let account = await database
    .first()
    .from("users")
    .where("email","=",email);
  if (account) {
    request.log("Got account", account);
    delete account.passwordHash;
  }
  return Promise.resolve(account);
}

export async function getUserByEmailAndPassword(request: Request, email: string, password: string) {
  let account = await database
    .first()
    .from("users")
    .where("email","=",email);
  if (account) {
    request.log("Got account", account);
    if (await bcrypt.compare(password, account.passwordHash)) {
      delete account.passwordHash;
    } else {
      account = null;
    }
  }
  return Promise.resolve(account);
}

export async function createUser(request: Request, email: string, password: string) {
  let success = false;
  request.log(["users"], `Creating user ${email}`);
  const hash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_SALT_ROUNDS!));
  const result = await database("users").insert({ email: email, passwordHash: hash });
  if (result.command == "INSERT" && result.rowCount == 1) {
    success = true;
  }
  return Promise.resolve(success);
}
