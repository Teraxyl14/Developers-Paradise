/**
 * Shared application constants.
 * Centralised here to avoid duplicating magic values across the codebase.
 */

/** Emails with full admin privileges (dashboard, seed, delete, email). */
export const ADMIN_EMAILS: readonly string[] = [
  'maruttewari12@gmail.com',
  'myraanand06@gmail.com',
] as const;

/** Platform metadata used across legal pages and security.txt. */
export const PLATFORM = {
  name: "Developer's Paradise",
  domain: 'developersparadise.com',
  securityEmail: 'security@developersparadise.com',
  supportEmail: 'support@developersparadise.com',
  dmcaEmail: 'dmca@developersparadise.com',
} as const;
