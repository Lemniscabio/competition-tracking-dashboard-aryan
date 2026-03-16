import Link from 'next/link';
import AddCompetitorForm from '@/components/competitors/AddCompetitorForm';

export default function AddCompetitorPage() {
  return (
    <div>
      <div className="mb-6">
        <Link
          href="/dashboard/competitors"
          className="text-sm text-text-muted hover:text-text transition-colors"
        >
          &larr; Back to competitors
        </Link>
        <h1 className="text-2xl font-bold text-text mt-2">Add Competitor</h1>
        <p className="text-text-muted text-sm mt-0.5">
          Add a new competitor to track. A full analysis and initial signal scan will be generated automatically.
        </p>
      </div>
      <AddCompetitorForm />
    </div>
  );
}
