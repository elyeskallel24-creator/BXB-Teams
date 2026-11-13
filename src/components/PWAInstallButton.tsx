import { Download } from 'lucide-react';

export function PWAInstallButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative mt-8 inline-flex items-center gap-3 overflow-hidden rounded-full
                 border border-white/[0.08] bg-white/[0.04] py-2 pl-2 pr-7 text-[14px] font-medium
                 tracking-wide text-white/90 backdrop-blur-xl
                 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_8px_24px_-8px_rgba(0,0,0,0.8)]
                 transition-all duration-500 ease-out
                 hover:-translate-y-0.5 hover:border-[#FF6B2C]/40 hover:bg-white/[0.07] hover:text-white
                 hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12),0_12px_40px_-10px_rgba(255,107,44,0.45)]
                 active:translate-y-0 active:scale-[0.985]
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B2C]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0C]
                 motion-reduce:transition-none"
    >
      {/* light sweep */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12
                   bg-gradient-to-r from-transparent via-white/[0.12] to-transparent
                   -translate-x-full opacity-0 transition-all duration-[900ms] ease-out
                   group-hover:translate-x-[320%] group-hover:opacity-100 motion-reduce:hidden"
      />

      {/* icon tile */}
      <span
        className="relative grid h-9 w-9 place-items-center rounded-full border border-[#FF6B2C]/25
                   bg-gradient-to-b from-[#FF6B2C]/20 to-[#FF6B2C]/5
                   shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)]
                   transition-colors duration-500 group-hover:border-[#FF6B2C]/60 group-hover:from-[#FF6B2C]/35"
      >
        <Download
          size={17}
          strokeWidth={2.25}
          className="text-[#FF6B2C] transition-transform duration-500 ease-out group-hover:translate-y-[1.5px] motion-reduce:transition-none"
        />
      </span>

      <span className="relative">Download BXB Teams App</span>
    </button>
  );
}
