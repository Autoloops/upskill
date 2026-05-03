"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

export function SearchBar({
  initialQuery = "",
  placeholder = "Search 10,000+ skills · 'design a landing page', 'stripe checkout', 'email triage'"
}: {
  initialQuery?: string;
  placeholder?: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(initialQuery || params.get("q") || "");

  // Push query into the URL so search results are shareable.
  useEffect(() => { setQ(initialQuery || params.get("q") || ""); }, [initialQuery, params]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const next = q.trim();
        router.push(next ? `/?q=${encodeURIComponent(next)}` : "/");
      }}
      className="relative w-full"
    >
      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
        <Search size={16} className="text-fog-400" />
      </span>
      <input
        autoFocus
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-11 pr-28 py-3 rounded-xl border border-ink-line bg-ink-panel/80 backdrop-blur-sm text-fog-100 placeholder:text-fog-500 font-mono text-[13px] outline-none transition-colors focus:border-accent-border focus:bg-ink-panel"
      />
      <button
        type="submit"
        className="absolute inset-y-0 right-0 my-1.5 mr-1.5 px-4 rounded-lg bg-accent text-ink font-semibold text-xs tracking-micro uppercase hover:bg-accent/90 transition-colors"
      >
        Search
      </button>
    </form>
  );
}
