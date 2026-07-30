import { Button } from '@/components/ui/button';
import { Plus, UploadCloud, UserPlus } from 'lucide-react';
import { ParticipantTable } from '@/features/participants/components/ParticipantTable';
import { ParticipantDialog } from '@/features/participants/components/ParticipantDialog';

export default function ParticipantsPage() {
  return (
    <>
      <div className='mt-10'>
        <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Manajemen Peserta</h1>
        
      </div>
      <div className="mt-4">
        <ParticipantTable />
      </div>
      {/* FAB   */}
      <div className="fixed right-6 bottom-24 z-40">
        <ParticipantDialog trigger={
          <button className="w-14 h-14 bg-primary text-on-primary rounded-2xl shadow-xl flex items-center justify-center active:scale-95 transition-transform duration-150">
            <UserPlus className="w-8 h-8" strokeWidth={2} />
          </button>
        } />
      </div>
      </div>
    </>
  );
}
