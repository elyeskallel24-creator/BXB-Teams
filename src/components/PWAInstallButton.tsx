import { Download } from 'lucide-react';

export function PWAInstallButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative mt-8 inline-flex items-center gap-3 overflow-hidden rounded-full
                 border border-[#DADADF] bg-white
                 py-2 pl-2 pr-7 text-[14px] font-semibold tracking-wide
                 shadow-[0_1px_2px_rgba(16,24,40,0.08),0_8px_20px_-6px_rgba(16,24,40,0.16)]
                 transition-all duration-300 ease-out
                 hover:-translate-y-0.5 hover:border-[#FF6B2C]
                 hover:shadow-[0_1px_2px_rgba(16,24,40,0.06),0_12px_28px_-6px_rgba(255,107,44,0.35)]
                 active:translate-y-0 active:scale-[0.985]
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B2C]/60
                 focus-visible:ring-offset-2 focus-visible:ring-offset-white

                 dark:border-white/10 dark:bg-[#111113]
                 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_8px_24px_-8px_rgba(0,0,0,0.8)]
                 dark:hover:border-[#FF6B2C]/70
                 dark:hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12),0_12px_40px_-10px_rgba(255,107,44,0.45)]
                 dark:focus-visible:ring-offset-[#0A0A0C]
                 motion-reduce:transition-none"
    >
      {/* light sweep */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12
                   bg-gradient-to-r from-transparent via-[#FF6B2C]/10 to-transparent
                   -translate-x-full opacity-0 transition-all duration-[900ms] ease-out
                   group-hover:translate-x-[320%] group-hover:opacity-100
                   dark:via-white/[0.12] motion-reduce:hidden"
      />

      {/* icon tile */}
      <span
        className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full
                   border border-[#FFD9C5] bg-[#FFF3ED]
                   transition-colors duration-300
                   group-hover:border-[#FF6B2C]/50 group-hover:bg-[#FFE8DC]

                   dark:border-[#FF6B2C]/30 dark:bg-[#1C100A]
                   dark:bg-gradient-to-b dark:from-[#FF6B2C]/30 dark:to-[#FF6B2C]/5
                   dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.10)]
                   dark:group-hover:border-[#FF6B2C]/60 dark:group-hover:bg-[#1C100A]
                   dark:group-hover:from-[#FF6B2C]/45"
      >
        <Download
          size={17}
          strokeWidth={2.25}
          className="text-[#FF6B2C] transition-transform duration-300 ease-out
                     group-hover:translate-y-[1.5px] motion-reduce:transition-none"
        />
      </span>

      <span className="relative !text-[#171719] dark:!text-white/90">
        Download BXB Teams App
      </span>
    </button>
  );
}
