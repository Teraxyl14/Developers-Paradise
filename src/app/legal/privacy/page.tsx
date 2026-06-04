import type { Metadata } from 'next';
import { PLATFORM } from '@/lib/constants';

export const metadata: Metadata = {
  title: `Privacy Policy | ${PLATFORM.name}`,
  description: `Privacy Policy for the ${PLATFORM.name} platform — DPDPA, GDPR, and CCPA compliant.`,
};

export default function PrivacyPage() {
  return (
    <>
      <h1>Privacy Policy</h1>
      <p className="text-text-muted text-sm">
        <strong>Effective Date:</strong> June 3, 2026
      </p>

      <hr />

      <p>
        This Privacy Policy explains how Developers Paradise collects, processes, and protects your data in compliance
        with the DPDPA (India), GDPR (EU), and CCPA (California).
      </p>

      <h2>1. Data Segregation</h2>
      <p>
        We maintain a strict zero-trust boundary between &ldquo;User Account Data&rdquo; (data you provide to us) and
        &ldquo;Algorithmic Pipeline Data&rdquo; (aggregated public market data).
      </p>

      <h2>2. User Account Data</h2>
      <p>
        When you register for our B2B DaaS, we collect minimal PII necessary for service delivery: email addresses,
        authentication sessions, and payment IDs.
      </p>
      <ul>
        <li>
          <strong>Sub-Processors:</strong> We utilize Vercel (Hosting/Compute), Stripe (Payment Processing), and
          Upstash (Rate Limiting). Your User Account Data is shared with these sub-processors securely.
        </li>
      </ul>

      <h2>3. Algorithmic Pipeline Data &amp; Public Exemptions</h2>
      <p>
        Our OSINT engine analyzes publicly available data. We rely on statutory exemptions (such as DPDPA Section
        3(c)(ii)) for processing data voluntarily made public. We execute Named Entity Recognition (NER) models at
        the edge to scrub and anonymize potential PII before it enters our vector database.
      </p>

      <h2>4. Your Rights &amp; The Right to be Forgotten</h2>
      <p>
        You have the right to access, correct, or request the deletion of your User Account Data. To execute a Right
        to be Forgotten (RTBF) request, contact us at{' '}
        <a href="mailto:privacy@developersparadise.com">privacy@developersparadise.com</a>. We will process your
        deletion within 30 days. Note: Deletion of User Account Data does not necessitate the deletion of anonymized,
        mathematical vector embeddings stored in our intelligence clusters.
      </p>
    </>
  );
}
