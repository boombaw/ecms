import { ResultTable } from '@/features/results/components/ResultTable';

export default function ResultsPage() {
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold md:text-2xl text-on-surface">Input Hasil Juara Lomba</h1>
      </div>
      <div>
        <ResultTable />
      </div>
    </>
  );
}
