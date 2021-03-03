declare module 'node-iplocate';

interface LookupResult {
  ip: string,
  country: string | null,
  country_code: string | null,
  city: string | null,
  continent: string | null,
  latitude: float | null,
  longitude: float | null,
  time_zone: string | null,
  postal_code: string | null,
  org: string | null,
  asn: string | null,
  subdivision: string | null,
  subdivision2: string | null
}
