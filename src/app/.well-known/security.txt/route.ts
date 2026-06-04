/**
 * RFC 9116 — security.txt
 * @see https://www.rfc-editor.org/rfc/rfc9116
 *
 * Served at /.well-known/security.txt as required by the standard.
 */
export async function GET() {
  const securityTxt = `
Contact: mailto:security@developersparadise.com
Expires: 2027-01-01T00:00:00Z
Preferred-Languages: en
Canonical: https://developers-paradise.com/.well-known/security.txt
Policy: We welcome white-hat vulnerability disclosures. Please do not execute destructive attacks (e.g., DDoS, data deletion) against our Next.js edge network, Qdrant VPC, or NVFP4 infrastructure during testing.
  `.trim();

  return new Response(securityTxt, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
