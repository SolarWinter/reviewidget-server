import dns from "dns";

export function dnsResolve(domain: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    dns.resolve(domain, (err, res) => {
      if (err) reject(err);
      else resolve(res);
    })
  })
}