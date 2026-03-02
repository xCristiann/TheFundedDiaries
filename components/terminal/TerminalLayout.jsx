"use client";

export default function TerminalLayout({ title, subtitle, right, children }) {
  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">
              {title} <span className="text-[#8b7306]">{/* accent */}</span>
            </h1>
            {subtitle && <p className="text-gray-400 mt-1">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-3">
            {right}
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}
