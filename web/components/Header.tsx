import Link from "next/link";
import { GithubIcon, PackageIcon } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-ink/70 border-b border-ink-line">
      <div className="container-tight flex items-center justify-between h-14">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="font-mono text-accent text-lg leading-none">{">"}_</span>
            <span className="font-semibold tracking-tight text-fog-100 group-hover:text-accent transition-colors">
              upskill
            </span>
            <span className="text-fog-500 text-2xs font-mono ml-1 hidden sm:inline">registry</span>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <NavLink href="/">Browse</NavLink>
            <NavLink href="/leaderboard">Top skills</NavLink>
            <NavLink href="/repos">Top repos</NavLink>
            <NavLink href="/stats">Stats</NavLink>
          </nav>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <a
            href="https://www.npmjs.com/package/@autoloops/upskill"
            target="_blank"
            rel="noreferrer"
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-ink-line bg-ink-panel/60 hover:border-ink-divider hover:bg-ink-panel/80 transition-colors text-fog-300 hover:text-fog-100"
          >
            <PackageIcon size={14} />
            <span className="font-mono text-2xs">@autoloops/upskill</span>
          </a>
          <a
            href="https://github.com/Autoloops/upskill"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-ink-line bg-ink-panel/60 hover:border-ink-divider hover:bg-ink-panel/80 transition-colors text-fog-300 hover:text-fog-100"
          >
            <GithubIcon size={14} />
            <span className="font-mono text-2xs hidden sm:inline">github</span>
          </a>
        </div>
      </div>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-2.5 py-1.5 rounded-md text-fog-300 hover:text-fog-100 hover:bg-ink-panel/60 transition-colors"
    >
      {children}
    </Link>
  );
}
