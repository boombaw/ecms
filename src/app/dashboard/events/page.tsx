import { EventDialog } from '@/features/events/components/EventDialog';
import { EventTable } from '@/features/events/components/EventTable';
import { CalendarPlus } from 'lucide-react';

export default function EventsPage() {
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold md:text-2xl text-on-surface">Manajemen Event</h1>
      </div>
      <div>
        <EventTable />
      </div>

      {/* FAB   */}
      <div className="fixed right-6 bottom-24 z-40">
        <EventDialog trigger={
          <button className="w-14 h-14 bg-primary text-on-primary rounded-2xl shadow-xl flex items-center justify-center active:scale-95 transition-transform duration-150">
            <CalendarPlus className="w-8 h-8" strokeWidth={2} />
          </button>
        } />
      </div>
    </>
  );
}
