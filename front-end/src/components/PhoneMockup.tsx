import type { ReactNode } from "react";

export function PhoneMockup({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-neutral-100 sm:p-6">
      <div
        className="relative w-full sm:w-[390px] sm:h-[844px] h-screen overflow-hidden bg-white sm:rounded-[32px] sm:shadow-[0_20px_60px_-20px_rgba(0,0,0,0.25)]"
      >
        {children}
      </div>
    </div>
  );
}
