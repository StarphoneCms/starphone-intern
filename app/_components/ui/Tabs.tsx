"use client";

import { useState, ReactNode } from "react";

type Tab = {
  key: string;
  label: string;
  content: ReactNode;
};

export function Tabs({ tabs }: { tabs: Tab[] }) {
const [active, setActive] = useState<string | undefined>(
  tabs.length ? tabs[0].key : undefined
);
  const current = tabs.find((t) => t.key === active);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActive(t.key)}
            className={`px-4 py-2 text-sm border-b-2 transition ${
              active === t.key
                ? "border-black font-semibold"
                : "border-transparent opacity-70 hover:opacity-100"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div>{current?.content}</div>
    </div>
  );
}