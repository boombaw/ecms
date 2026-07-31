import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { RegistrationTable } from '@/features/registrations/components/RegistrationTable';

export default function RegistrationsPage() {
  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Pendaftaran Lomba</h1>
        <Button className="gap-2 bg-primary hover:bg-primary/90 text-white">
          <Plus className="h-4 w-4" />
          Daftarkan Peserta
        </Button>
      </div>
      <div className="mt-4">
        <RegistrationTable />
      </div>
    </>
  );
}
