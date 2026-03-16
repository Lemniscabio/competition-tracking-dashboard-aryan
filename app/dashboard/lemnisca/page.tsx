import LemniscaProfileForm from '@/components/lemnisca/LemniscaProfileForm';

export default function LemniscaPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text">Lemnisca Profile</h1>
        <p className="text-text-muted text-sm mt-0.5">
          Your company self-assessment. Used as reference for all competitive analyses.
        </p>
      </div>
      <LemniscaProfileForm />
    </div>
  );
}
