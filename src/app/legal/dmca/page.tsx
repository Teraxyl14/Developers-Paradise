import type { Metadata } from 'next';
import { PLATFORM } from '@/lib/constants';

export const metadata: Metadata = {
  title: `Copyright & DMCA Policy | ${PLATFORM.name}`,
  description: `DMCA takedown policy and copyright procedures for the ${PLATFORM.name} platform.`,
};

export default function DmcaPage() {
  return (
    <>
      <h1>Copyright &amp; DMCA Policy</h1>
      <p className="text-text-muted text-sm">
        <strong>Effective Date:</strong> June 3, 2026
      </p>

      <hr />

      <p>
        Developers Paradise respects intellectual property rights and complies with the Digital Millennium Copyright
        Act (DMCA) and corresponding international safe harbor regulations. Our engine synthesizes uncopyrightable
        factual data; however, if you believe your copyrighted work has inadvertently been reproduced on our platform,
        please submit a formal takedown notice.
      </p>

      <h2>Notification of Infringement (17 U.S.C. &sect; 512(c)(3))</h2>
      <p>To file a valid takedown request, you must provide our Copyright Agent with:</p>
      <ol>
        <li>A physical or electronic signature of the copyright owner or authorized representative.</li>
        <li>Identification of the copyrighted work claimed to have been infringed.</li>
        <li>
          Identification of the infringing material and its exact location (URL) on our platform.
        </li>
        <li>Your contact information (address, telephone number, and email).</li>
        <li>
          A statement that you have a good faith belief that the use of the material is not authorized by the
          copyright owner.
        </li>
        <li>A statement made under penalty of perjury that the information is accurate.</li>
      </ol>

      <h2>Copyright Agent Contact</h2>
      <p>
        Email:{' '}
        <a href="mailto:dmca@developersparadise.com">dmca@developersparadise.com</a>
      </p>
    </>
  );
}
