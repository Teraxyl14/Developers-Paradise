import type { Metadata } from 'next';
import { PLATFORM } from '@/lib/constants';

export const metadata: Metadata = {
  title: `Terms of Service | ${PLATFORM.name}`,
  description: `Terms of Service governing the use of the ${PLATFORM.name} B2B Data-as-a-Service platform.`,
};

export default function TermsPage() {
  return (
    <>
      <h1>Terms of Service</h1>
      <p className="text-text-muted text-sm">
        <strong>Effective Date:</strong> June 3, 2026
      </p>

      <hr />

      <p>
        Welcome to Developers Paradise. By accessing our API, utilizing our Next.js frontend, or authenticating via
        Auth.js, you agree to be bound by these Terms of Service.
      </p>

      <h2>1. Service Description</h2>
      <p>
        Developers Paradise provides Business-to-Business (B2B) Data-as-a-Service (DaaS). We provide algorithmic
        Product-Market Fit (PMF) blueprints generated via the computational analysis of factual, public data streams.
      </p>

      <h2>2. &ldquo;As-Is&rdquo; and Limitation of Liability</h2>
      <p>
        All data, vector embeddings, and architectural blueprints are provided &ldquo;AS-IS&rdquo; and
        &ldquo;AS-AVAILABLE.&rdquo; Developers Paradise strictly disclaims all warranties, including implied
        warranties of merchantability or fitness for a particular purpose. We are not liable for business
        interruptions, data inaccuracies, or infrastructural failures resulting from changes to third-party public DOM
        structures or APIs.
      </p>

      <h2>3. Anti-Scraping &amp; Acceptable Use</h2>
      <p>
        While our engine analyzes public data, the PMF blueprints and vector data provided on this platform are
        proprietary.{' '}
        <strong>
          You are strictly prohibited from using automated bots, scrapers, headless browsers, or any programmatic
          extraction tools against the Developers Paradise frontend or API infrastructure.
        </strong>
      </p>

      <h2>4. Account Termination</h2>
      <p>
        We reserve the absolute right to suspend, terminate, or revoke API access without notice or refund if we
        detect unauthorized extraction, credential sharing, or violations of these Terms.
      </p>

      <h2>5. Governing Law</h2>
      <p>
        These terms shall be governed by and construed in accordance with the laws of New Delhi, India, without regard
        to its conflict of law provisions.
      </p>
    </>
  );
}
