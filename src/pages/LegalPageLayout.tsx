import type { ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';
import { goHome } from '../legalNavigate';
import { LEGAL_APP_NAME, LEGAL_CONTACT_EMAIL, LEGAL_DEVELOPER_NAME } from './legalConfig';

type LegalPageLayoutProps = {
  title: string;
  subtitle: string;
  backLabel: string;
  footerNote: string;
  lastUpdatedLabel: string;
  contactLabel: string;
  children: ReactNode;
};

export function LegalPageLayout({
  title,
  subtitle,
  backLabel,
  footerNote,
  lastUpdatedLabel,
  contactLabel,
  children,
}: LegalPageLayoutProps) {
  return (
    <div className="lq-legal-page min-h-[100dvh] animate-fade-in">
      <div className="mx-auto w-full max-w-lg px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={goHome}
          className="mb-4 inline-flex min-h-[44px] items-center gap-1 rounded-full border border-rose-200/60 bg-white/90 px-3.5 py-2 text-[14px] font-semibold text-[#5c4d55] shadow-sm backdrop-blur-sm transition active:scale-[0.98]"
        >
          <ChevronLeft className="h-4 w-4 shrink-0 text-rose-500" aria-hidden />
          {backLabel}
        </button>

        <header className="mb-5 rounded-3xl border border-rose-200/50 bg-white/90 px-5 py-6 shadow-[0_10px_36px_-14px_rgba(244,114,182,0.22)] backdrop-blur-sm">
          <p className="text-[11px] font-bold uppercase tracking-wide text-rose-500">{LEGAL_APP_NAME}</p>
          <h1 className="mt-1.5 text-[1.4rem] font-extrabold leading-snug tracking-tight text-[#3a2e34]">
            {title}
          </h1>
          <p className="mt-2 text-[13px] leading-relaxed text-[#8a7a84]">{subtitle}</p>
        </header>

        <div className="space-y-3">{children}</div>

        <footer className="mt-8 space-y-3 rounded-2xl border border-rose-200/45 bg-gradient-to-br from-rose-50/95 via-white/90 to-pink-50/80 px-4 py-5 text-center shadow-[0_6px_24px_-12px_rgba(244,114,182,0.18)]">
          <p className="text-[13px] leading-relaxed text-[#5c4d55]">{footerNote}</p>
          <p className="text-[12px] font-medium text-[#8a7a84]">
            開發者：{LEGAL_DEVELOPER_NAME}
          </p>
          <p className="text-[12px] font-medium text-[#8a7a84]">{lastUpdatedLabel}</p>
          <p className="text-[13px] text-[#5c4d55]">
            {contactLabel}{' '}
            <a
              href={`mailto:${LEGAL_CONTACT_EMAIL}`}
              className="font-semibold text-rose-600 underline decoration-rose-200 underline-offset-2"
            >
              {LEGAL_CONTACT_EMAIL}
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}

type LegalSectionProps = {
  index: number;
  title: string;
  children: ReactNode;
};

export function LegalSection({ index, title, children }: LegalSectionProps) {
  return (
    <section className="rounded-2xl border border-rose-100/55 bg-white/88 p-4 shadow-[0_4px_20px_-10px_rgba(244,114,182,0.12)] backdrop-blur-sm">
      <div className="mb-2.5 flex items-start gap-2.5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rose-100/90 text-xs font-bold text-rose-700">
          {index}
        </span>
        <h2 className="pt-0.5 text-[16px] font-bold leading-snug text-[#3a2e34]">{title}</h2>
      </div>
      <div className="text-[15px] leading-[1.65] text-[#5c4d55]">{children}</div>
    </section>
  );
}

export function LegalBulletList({ items }: { items: string[] }) {
  return (
    <ul className="mt-2.5 space-y-2">
      {items.map((item) => (
        <li key={item} className="flex gap-2.5">
          <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" aria-hidden />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
