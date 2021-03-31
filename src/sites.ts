import { Request, ResponseToolkit, ResponseObject } from "@hapi/hapi";
import { v4 as uuid } from "uuid";
import moment from "moment";

import Joi from "joi";
const ValidationError = Joi.ValidationError;

// TODO split into separate type file
import { Site } from "./queries";

import { server } from "./server";
import { createSite, deleteSite, updateSite } from "./queries";
import { getSiteById, getSitesForUser, getCampaignsForSiteId } from "./queries";
import { setSiteVerified } from "./queries";
import { dnsResolve } from "./utils";

declare module "@hapi/hapi" {
  interface AuthCredentials {
    id: string;
    email: string;
  }
}

const schema = Joi.object({
  id: Joi.number().positive(),
  user_id: Joi.number().required().positive(),
  domain: Joi.alternatives().required().try(Joi.string().domain(), Joi.string().ip()),
  active: Joi.boolean().required(),
  alias: Joi.string().required(),
  verified: Joi.boolean().required()
});

async function addSiteRender(_request: Request, h: ResponseToolkit): Promise<ResponseObject> {
  return h.view("addsite");
}

async function addSitePost(request: Request, h: ResponseToolkit): Promise<ResponseObject> {
  let siteDetails: Site = ({} as Site);
  try {
    siteDetails = (request.payload as Site);
    siteDetails["user_id"] = parseInt(request.auth.credentials.id);
    siteDetails["alias"] = uuid().substr(0, 8);
    siteDetails["verified"] = false;
    if (siteDetails.active === undefined) {
      siteDetails.active = false;
    }
    const o = schema.validate(siteDetails, { stripUnknown: true });
    if (o.error) {
      throw o.error;
    }
    siteDetails = (o.value as Site);
    const id = await createSite(request, siteDetails);
    return h.redirect("/sites/" + id);
  } catch (err) {
    const errors: { [key: string]: string } = {};
    if (err instanceof ValidationError && err.isJoi) {
      for (const detail of err.details) {
        errors[detail.context!.key!] = detail.message;
      }
    } else {
      console.error("error", err);
      request.log(["error", "sites"], "Error adding site");
    }

    return h.view("addsite", { errors: errors, site: siteDetails });
  }
}

async function showSites(request: Request, h: ResponseToolkit ): Promise<ResponseObject> {
  const sites = await getSitesForUser(request.auth.credentials.id);
  return h.view("sites", { sites: sites });
}

async function showSite(request: Request, h: ResponseToolkit): Promise<ResponseObject> {
  const site = await getSiteById(request.params.siteId, request.auth.credentials.id);
  const campaigns = await getCampaignsForSiteId(request.params.siteId);
  return h.view("site", { site: site, campaigns: campaigns, moment: moment });
}

async function deleteSiteRender(request: Request, h: ResponseToolkit): Promise<ResponseObject> {
  const site = await getSiteById(request.params.siteId, request.auth.credentials.id);
  const u = new URL(request.headers.referer);
  return h.view("deleteSite", { site: site, previousUrl: u.pathname });
}

interface UrlPayload {
  previousUrl: string;
}
async function deleteSitePost(request: Request, h: ResponseToolkit): Promise<ResponseObject> {
  const site = await getSiteById(request.params.siteId, request.auth.credentials.id);
  await deleteSite(request, site.id!, request.auth.credentials.id);
  return h.redirect((request.payload as UrlPayload).previousUrl);
}

async function editSiteRender(request: Request, h: ResponseToolkit): Promise<ResponseObject> {
  const site = await getSiteById(request.params.siteId, request.auth.credentials.id);
  return h.view("editSite", { site: site });
}

async function editSitePost(request: Request, h: ResponseToolkit): Promise<ResponseObject> {
  try {
    const site = await getSiteById(request.params.siteId, request.auth.credentials.id);
    let siteDetails: Site = (request.payload as Site);
    siteDetails["user_id"] = parseInt(request.auth.credentials.id);
    if (siteDetails.active === undefined) {
      siteDetails.active = false;
    }
    // We have to fill these in, the user can't be trusted.
    siteDetails.alias = site.alias;
    siteDetails.verified = site.verified;
    const o = schema.validate(siteDetails, { stripUnknown: true });
    if (o.error) {
      throw o.error;
    }
    siteDetails = (o.value as Site);
    const id = await updateSite(request, request.params.siteId, siteDetails);
    return h.redirect("/sites/" + id);
  } catch (err) {
    const site = await getSiteById(request.params.siteId, request.auth.credentials.id);
    const errors: { [key: string]: string } = {};
    if (err instanceof ValidationError && err.isJoi) {
      for (const detail of err.details) {
        errors[detail.context!.key!] = detail.message;
      }
    } else {
      console.error("error", err);
      request.log(["error", "sites"], "Error adding site");
    }
    return h.view("editSite", { site: site, errors: errors });
  }
}

export async function verifySite(site: Site) {
  try {
    server.log(["background", "verification", "debug"], `Verifying ${site.alias} for ${site.domain}`);
    let domain = site.alias;
    if (process.env.NODE_ENV !== "development") {
      // Debug/testing
      domain += ".lvh.me";
    }
    const res = await dnsResolve(domain);
    const valid = ((res.length == 1) && (res[0] == "127.0.0.1"));
    if (valid != site.verified) {
      setSiteVerified(site, valid);
    }
  } catch (err) {
    console.error("Error", err, "updating site", site.id, "after verification");
    server.log(["error", "verification", "background"], `Error ${err} updating site ${site.id} after verification`);
  }
}

export const siteRoutes = [
  {
    method: "GET",
    path: "/sites",
    handler: showSites
  },
  {
    method: "GET",
    path: "/sites/add",
    handler: addSiteRender
  },
  {
    method: "POST",
    path: "/sites/add",
    handler: addSitePost
  },
  {
    method: "GET",
    path: "/sites/{siteId}",
    handler: showSite
  },

  {
    method: "GET",
    path: "/sites/{siteId}/edit",
    handler: editSiteRender
  },
  {
    method: "POST",
    path: "/sites/{siteId}/edit",
    handler: editSitePost
  },

  {
    method: "GET",
    path: "/sites/{siteId}/delete",
    handler: deleteSiteRender
  },
  {
    method: "POST",
    path: "/sites/{siteId}/delete",
    handler: deleteSitePost
  }
]
