import dns from "dns";
import { promisify } from "util";
import { redisConnection } from "@nfe/config";

const resolveMx = promisify(dns.resolveMx);
const resolveTxt = promisify(dns.resolveTxt);

export class DNSChecker {
  public static async check(
    domain: string,
  ): Promise<{ hasMx: boolean; mxRecords: dns.MxRecord[]; hasSpf: boolean }> {
    const cacheKey = `dns:${domain}`;
    try {
      const cached = await redisConnection.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (err) {
      // ignore cache error
    }
    let mxRecords: dns.MxRecord[] = [];
    let hasMx = false;
    let hasSpf = false;

    try {
      mxRecords = await resolveMx(domain);
      mxRecords.sort((a, b) => a.priority - b.priority);
      hasMx = mxRecords.length > 0;
    } catch (e) {
      // MX lookup failed
    }

    try {
      const txtRecords = await resolveTxt(domain);
      hasSpf = txtRecords.some((records) =>
        records.some((r) => r.startsWith("v=spf1")),
      );
    } catch (e) {
      // TXT lookup failed
    }

    const result = { hasMx, mxRecords, hasSpf };
    try {
      await redisConnection.setex(cacheKey, 3600, JSON.stringify(result)); // Cache for 1 hour
    } catch (err) {
      // ignore cache set error
    }

    return result;
  }
}
