import { Request, Server } from "@hapi/hapi";
import bcrypt from "bcrypt";
import Boom from "@hapi/boom";

import { LookupResult } from "node-iplocate";

import Knex from "knex";
import { QueryBuilder } from "knex";
/* @ts-ignore:disable-next-line */
import knexConfig from '../knexfile';

let config: Knex.Config;
switch (process.env.NODE_ENV) {
  case undefined:
    // If undefined, fall through to development.
  case "development":
    config = knexConfig.development;
    break;
  case "test":
    config = knexConfig.test;
    break;
  default:
    config = knexConfig.production;
    break;
}

export const database: Knex = Knex(config);

export interface Site {
  id?: number;
  user_id: number;
  domain: string;
  active: boolean;
  alias: string;
  verified: boolean;
}

export interface Campaign {
  id?: number;
  site_id: number;
  active: boolean;
  reviewSiteName: string;
  reviewSiteUrl: string;
  reviewThreshold: number;
  thankText: string;
  start: Date;
  finish: Date;
}

export interface User {
  id: number;
  email: string;
  passwordHash: string;
}

export interface Redirect {
  id: number;
  campaign_id: number;
  remoteIp: string;
}

// async function printSql(query: QueryBuilder, msg?: string) {
//   const sql = await query.toSQL();
//   if (msg) {
//     console.log(msg);
//   }
//   console.log(sql.sql);
// }

export function ensureInt(i : number | string) : number {
  if (typeof i == "string") {
    i = parseInt(i);
  }
  return i;
}

async function runQuery(query: QueryBuilder) {
  // console.log("runQuery running query", query);
  const result = await query;
  // console.log("result", result);
  if (!result) {
    // console.log("runQuery running query", query);
    // console.log("not found");
    throw Boom.notFound();
  }
  return result;
}

export function getAllSites(): Promise<Site[]> {
  return database('sites');
}

// Used only for getting review data so we can supply it to the widget
export function getSiteByDomain(site: string): Promise<Site> {
  return runQuery(database
    .first()
    .from("sites")
    .where({ domain: site }));
}

export function getSitesForUser(userId: number | string, fields?: string[]): Promise<Site[]> {
  userId = ensureInt(userId);
  let query = database.from("sites");
  if (fields) {
    query = query.select(fields);
  }
  query = query.where({ user_id: userId });
  return runQuery(query);
}

export async function getSiteById(siteId: number | string, userId: number | string): Promise<Site> {
  siteId = ensureInt(siteId);
  userId = ensureInt(userId);
  return runQuery(database
    .first()
    .from("sites")
    .where({ id: siteId, user_id: userId }));
}

export async function getUnverifiedSites(): Promise<Site[]> {
  return runQuery(database.from("sites").where({ verified: false }));
}

export async function setSiteVerified(site: Site, verified: boolean): Promise<null> {
  console.log("Setting site", site.domain, "to verified:", verified);
  return runQuery(database
    .from("sites")
    .where({ id: site.id })
    .update({ verified: verified }));
}

export function addReview(site: string, rating: number, remote: string): Promise<number> {
  return runQuery(database
    .from("reviews")
    .insert({ domain: site, rating: rating, remoteIp: remote }, ["id"]));
}

// TODO Do better than unknown
export async function dbMigrate(server: Server): Promise<unknown> {
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

export async function getUserById(_request: Request, userId: number): Promise<User> {
  const account = await runQuery(database
    .first()
    .from("users")
    .where({ id: userId }));
  if (account) {
    delete account.passwordHash;
  }
  return Promise.resolve(account);
}

export async function getUserByEmail(_request: Request, email: string): Promise<User> {
  const account = await runQuery(database
    .first()
    .from("users")
    .where({ email: email }));
  if (account) {
    delete account.passwordHash;
  }
  return Promise.resolve(account);
}

export async function getUserByEmailAndPassword(_request: Request, email: string, password: string): Promise<User> {
  let account;
  try {
    account = await runQuery(database
      .first()
      .from("users")
      .where({ email: email }));

    if (await bcrypt.compare(password, account.passwordHash)) {
      delete account.passwordHash;
    } else {
      account = null;
    }
  } catch (err) {
    if (err.isBoom && (err.output.statusCode == 404)) {
      // User not found
      account = null;
    } else {
      console.error("Server error getting user");
      console.error(err);
      throw err;
    }
  }

  return Promise.resolve(account);
}

export async function createUser(request: Request, email: string, password: string): Promise<User> {
  request.log(["users"], `Creating user ${email}`);
  const hash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_SALT_ROUNDS!));
  const result = await runQuery(database("users").insert({ email: email, passwordHash: hash }, ["id"]));
  if (result.length == 1) {
    return Promise.resolve(result[0].id);
  } else {
    console.error("result", result);
    return Promise.reject("couldn't add user");
  }
}

export async function createSite(request: Request, siteDetails: Site): Promise<number> {
  request.log(["sites"], "Creating site" + siteDetails);
  const result = await runQuery(database("sites").insert(siteDetails, ["id"]));
  if (result.length == 1) {
    return Promise.resolve(result[0].id);
  } else {
    console.error("result", result);
    return Promise.reject("couldn't add site");
  }
}

export async function deleteSite(request: Request, siteId: number | string, userId: number | string): Promise<number> {
  siteId = ensureInt(siteId);
  userId = ensureInt(userId);
  request.log(["sites"], `Deleting site ${siteId} for ${userId}`);
  const result: number[] = await runQuery(database("sites")
    .where({ id: siteId, user_id: userId })
    .returning("id")
    .del());

  if (result.length == 1 && result[0] == siteId) {
    return Promise.resolve(result[0]);
  } else {
    return Promise.reject({ message: "Error deleting site" });
  }
}

export async function updateSite(_request: Request, siteId: number | string, siteDetails: Site): Promise<number> {
  siteId = ensureInt(siteId);
  const result: number[] = await runQuery(database("sites")
    .where({ id: siteId })
    .returning("id")
    .update(siteDetails));

  if (result.length == 1 && result[0] == siteId) {
    return Promise.resolve(result[0]);
  } else {
    return Promise.reject({ message: "Error updating site" });
  }
}

// TODO Do better than unknown
export function addRedirectEntry(campaign_id: number, remote: string, geoIpData: LookupResult): Promise<unknown> {
  return runQuery(database
    .from("redirects")
    .insert({ campaign_id: campaign_id, remoteIp: remote, geoIpData: geoIpData }, ["id"]));
}

export async function getCampaignsForUser(userId: number | string): Promise<Campaign[]> {
  userId = ensureInt(userId);
  return runQuery(database
    .from('campaigns')
    .select(["campaigns.*", "sites.domain"])
    .innerJoin('sites', {
      'campaigns.site_id': 'sites.id', 'sites.user_id': userId
    }))
}

export async function getCampaignsForSiteId(siteId: number | string): Promise<Campaign[]> {
  siteId = ensureInt(siteId);
  return runQuery(database
    .from('campaigns')
    .where({ site_id: siteId }))
}

export async function getActiveCampaignsForDomain(domain: string): Promise<Campaign[]> {
  return runQuery(database
    .from('campaigns')
    .select(["campaigns.*", "sites.domain"])
    .innerJoin('sites', {
      'campaigns.site_id': 'sites.id'
    })
    .where({ 'sites.domain': domain, 'campaigns.active': true }))
}

export function getCampaignById(campaignId: number | string): Promise<Campaign> {
  campaignId = ensureInt(campaignId);
  return runQuery(database
    .first()
    .from("campaigns")
    .where({ id: campaignId }));
}

export async function createCampaign(request: Request, campaignData: Campaign): Promise<number> {
  request.log(["campaigns"], `Creating campaign for site ${campaignData.site_id}`);
  campaignData.site_id = ensureInt(campaignData.site_id);
  const result = await runQuery(database("campaigns").insert(campaignData, ["id"]));
  if (result.length == 1) {
    return Promise.resolve(result[0].id);
  } else {
    console.error("result", result);
    request.log(["campaigns", "error"],
                `Couldn't add campaign for site ${campaignData.site_id}`)
    return Promise.reject("couldn't add campaign");
  }
}

export async function updateCampaign(_request: Request, campaignId: number | string, campaignDetails: Campaign): Promise<number> {
  campaignId = ensureInt(campaignId);
  const result: number[] = await runQuery(database("campaigns")
    .where({ id: campaignId })
    .returning("id")
    .update(campaignDetails));

  if (result.length == 1 && result[0] == campaignId) {
    return Promise.resolve(result[0]);
  } else {
    return Promise.reject({ message: "Error updating campaign" });
  }
}

export async function deleteCampaign(request: Request, campaignId: number | string): Promise<number> {
  campaignId = ensureInt(campaignId);
  request.log(["campaigns"], `Deleting campaign ${campaignId}`);
  const result: number[] = await runQuery(database("campaigns")
    .where({ id: campaignId })
    .returning("id")
    .del());

  if (result.length == 1 && result[0] == campaignId) {
    return Promise.resolve(result[0]);
  } else {
    return Promise.reject({ message: "Error deleting campaign" });
  }
}

export async function getRedirectsForCampaign(request: Request, campaignId: number | string): Promise<Redirect[]> {
  campaignId = ensureInt(campaignId);
  request.log(["campaigns"], `Getting redirects for campaign ${campaignId}`);
  // TODO do we need to filter these before returning, to remove elements?
  return runQuery(database("redirects").where({ campaign_id: campaignId }));
}

export async function dbClose(): Promise<unknown>  {
  return database.destroy();
}
