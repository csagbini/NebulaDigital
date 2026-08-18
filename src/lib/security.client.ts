/**
 * Constants shared between the browser and the server.
 *
 * These live apart from `security.ts` on purpose: that file imports
 * `node:crypto` and the database client, neither of which can be bundled into
 * client-side JavaScript.
 */

export const HONEYPOT_FIELD = "company_website";
