import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PLATFORM } from '@/lib/constants';

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-10 md:py-16">
        {/* Back navigation */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to {PLATFORM.name}
        </Link>

        {/* Legal content */}
        <article className="prose prose-zinc dark:prose-invert prose-headings:font-display prose-headings:tracking-tight prose-a:text-accent prose-a:no-underline hover:prose-a:underline prose-strong:text-text-primary prose-p:text-text-secondary prose-li:text-text-secondary prose-sm md:prose-base max-w-none">
          {children}
        </article>

        {/* Footer nav between legal pages */}
        <nav className="mt-16 pt-8 border-t border-border-default">
          <p className="text-xs text-text-muted mb-3 uppercase tracking-wider font-semibold">Other Policies</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/legal/terms" className="text-sm text-text-secondary hover:text-accent transition-colors">
              Terms of Service
            </Link>
            <Link href="/legal/privacy" className="text-sm text-text-secondary hover:text-accent transition-colors">
              Privacy Policy
            </Link>
            <Link href="/legal/dmca" className="text-sm text-text-secondary hover:text-accent transition-colors">
              DMCA Policy
            </Link>
          </div>
        </nav>
      </div>
    </div>
  );
}
