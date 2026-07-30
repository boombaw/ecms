import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { TeamTable } from '@/features/teams/components/TeamTable';

export default function TeamsPage() {
  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Manajemen Tim</h1>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Tambah Tim
        </Button>
      </div>
      <div className="mt-4">
        <TeamTable />
      </div>
    </>
  );
}
