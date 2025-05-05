"use client";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";

const FlagEN = () => (
  <span
    role="img"
    aria-label="English"
    className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white shadow border border-gray-200"
  >
    {/* UK Union Jack SVG */}
    <svg width="20" height="20" viewBox="0 0 24 24">
      <rect width="24" height="24" fill="#00247d"/>
      <path d="M0 0l24 24M24 0L0 24" stroke="#fff" strokeWidth="3"/>
      <path d="M0 0l24 24M24 0L0 24" stroke="#cf142b" strokeWidth="1.5"/>
      <rect x="9" width="6" height="24" fill="#fff"/>
      <rect y="9" width="24" height="6" fill="#fff"/>
      <rect x="10.2" width="3.6" height="24" fill="#cf142b"/>
      <rect y="10.2" width="24" height="3.6" fill="#cf142b"/>
    </svg>
  </span>
);
const FlagID = () => (
  <span
    role="img"
    aria-label="Bahasa Indonesia"
    className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white shadow border border-gray-200"
  >
    <svg width="20" height="20" viewBox="0 0 24 24">
      <rect width="24" height="12" fill="#e31b23"/>
      <rect y="12" width="24" height="12" fill="#fff"/>
      <rect width="24" height="24" fill="none" stroke="#e5e7eb" strokeWidth="0.5"/>
    </svg>
  </span>
);

export function LanguagePillToggle() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const isID = locale === "id";

  function switchLocale(l: string) {
    if (l === locale) return;
    const segments = pathname.split("/");
    if (segments[1] === "en" || segments[1] === "id") {
      segments[1] = l;
    } else {
      segments.splice(1, 0, l);
    }
    router.push(segments.join("/"));
  }

  return (
    <div className="flex gap-2 bg-[#fbeee5] p-1 rounded-full shadow-inner">
      <button
        className={`flex items-center justify-center w-9 h-9 rounded-full transition-all duration-150 focus:outline-none
          ${!isID
            ? 'bg-white ring-2 ring-[#e05d38] shadow-lg scale-105'
            : 'opacity-60 grayscale'}
        `}
        onClick={() => switchLocale('en')}
        aria-label="Switch to English"
      >
        <FlagEN />
      </button>
      <button
        className={`flex items-center justify-center w-9 h-9 rounded-full transition-all duration-150 focus:outline-none
          ${isID
            ? 'bg-white ring-2 ring-[#e05d38] shadow-lg scale-105'
            : 'opacity-60 grayscale'}
        `}
        onClick={() => switchLocale('id')}
        aria-label="Switch to Bahasa Indonesia"
      >
        <FlagID />
      </button>
    </div>
  );
}
