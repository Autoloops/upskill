export function Footer() {
  return (
    <footer className="border-t border-ink-line mt-24">
      <div className="container-tight py-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-2xs text-fog-400">
        <div className="flex items-center gap-3 font-mono">
          <span className="text-accent">{">_"}</span>
          <span>upskill registry</span>
          <span className="text-fog-500">·</span>
          <span>open source · MIT</span>
        </div>
        <div className="flex items-center gap-4 font-mono">
          <a href="https://github.com/Autoloops/upskill" target="_blank" rel="noreferrer" className="hover:text-fog-200 transition-colors">
            github.com/Autoloops/upskill
          </a>
          <span className="text-fog-500">·</span>
          <a href="https://www.npmjs.com/package/@autoloops/upskill" target="_blank" rel="noreferrer" className="hover:text-fog-200 transition-colors">
            npm
          </a>
          <span className="text-fog-500">·</span>
          <a href="https://mcp.autoloops.ai" target="_blank" rel="noreferrer" className="hover:text-fog-200 transition-colors">
            api
          </a>
        </div>
      </div>
    </footer>
  );
}
