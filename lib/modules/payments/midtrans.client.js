import midtransClient from "midtrans-client";
import { createHash } from "crypto";

export class MidtransClient {
  /**
   * Return server key and production flag from environment
   */
  static getConfig() {
    const serverKey = process.env.MIDTRANS_SERVER_KEY || "";
    const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "";
    const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";
    const apiBaseUrl = isProduction
      ? "https://api.midtrans.com"
      : "https://api.sandbox.midtrans.com";

    return { serverKey, clientKey, isProduction, apiBaseUrl };
  }

  /**
   * Create Snap Client instance
   */
  static getSnapClient() {
    const { serverKey, clientKey, isProduction } = this.getConfig();
    return new midtransClient.Snap({
      isProduction,
      serverKey,
      clientKey,
    });
  }

  /**
   * Verify SHA512 Signature Key: SHA512(order_id + status_code + gross_amount + server_key)
   */
  static verifySignature({ orderId, statusCode, grossAmount, signatureKey }) {
    const { serverKey } = this.getConfig();
    const signatureSource = `${orderId}${statusCode}${grossAmount}${serverKey}`;
    const computedSignature = createHash("sha512").update(signatureSource).digest("hex");
    return computedSignature === signatureKey;
  }

  /**
   * Query status directly from Midtrans REST API: GET /v2/{order_id}/status
   */
  static async queryTransactionStatus(orderId) {
    const { serverKey, apiBaseUrl } = this.getConfig();
    const authString = Buffer.from(`${serverKey}:`).toString("base64");

    const response = await fetch(`${apiBaseUrl}/v2/${orderId}/status`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Basic ${authString}`,
      },
      signal: AbortSignal.timeout(10000),
    });

    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  }
}

