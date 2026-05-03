import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-tight py-24 text-center">
      <h1 className="text-3xl font-bold text-fog-100 mb-3">Skill not found</h1>
      <p className="text-fog-400 mb-6">Either the skill_id is invalid, or the registry hasn't indexed it yet.</p>
      <Link href="/" className="text-accent hover:underline font-mono text-sm">← back to registry</Link>
    </div>
  );
}
