'use client';

import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toTitleCase } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Edit2, Trash2, Calendar, Plus, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { EventDialog } from './EventDialog';

type EventRow = {
  id: string;
  name: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  location: string | null;
  status: 'Draft' | 'Upcoming' | 'Ongoing' | 'Finished';
};

export function EventTable() {
  const queryClient = useQueryClient();
  const [editingEvent, setEditingEvent] = useState<EventRow | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: events, isLoading, error } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return (data as EventRow[]).map(row => ({
        ...row,
        name: toTitleCase(row.name),
        location: row.location ? toTitleCase(row.location) : null
      }));
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel('realtime-events')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'events' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['events'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus event "${name}"?`)) {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) {
        alert('Gagal menghapus event: ' + error.message);
      } else {
        queryClient.invalidateQueries({ queryKey: ['events'] });
      }
    }
  };

  const handleEdit = (event: EventRow) => {
    setEditingEvent({
      ...event,
      description: event.description || '',
      start_date: event.start_date || '',
      end_date: event.end_date || '',
      location: event.location || '',
    });
    setIsEditDialogOpen(true);
  };

  if (isLoading) {
    return <div className="p-8 text-center text-lg text-muted-foreground">Memuat data event...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-lg text-destructive">Gagal memuat data event.</div>;
  }

  return (
    <>
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex justify-between items-center hidden md:flex">
          <h2 className="text-2xl font-bold text-on-surface">Daftar Event</h2>
          <EventDialog />
        </div>
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            type="text" 
            placeholder="Cari nama event..." 
            className="pl-10 h-12 rounded-xl border-outline-variant bg-surface"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {!events || events.length === 0 ? (
        <div className="p-8 text-center text-lg text-muted-foreground border rounded-xl bg-card">
          Belum ada data event.
        </div>
      ) : (
        <>
          {/* Mobile View: Cards */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {events.filter((e) => e.name.toLowerCase().includes(searchQuery.toLowerCase())).map((event) => (
              <Card key={event.id} className="overflow-hidden border shadow-sm rounded-xl bg-white">
                <CardContent className="p-4 space-y-3">
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-bold text-lg text-slate-800 leading-tight">{event.name}</h3>
                    </div>
                    <Badge className="text-xs px-2 py-0.5 w-fit rounded-md bg-primary/10 text-primary hover:bg-primary/20 border-none" variant="outline">
                      {event.status || 'Draft'}
                    </Badge>
                  </div>
                  
                  <div className="bg-slate-50 p-3 rounded-xl flex items-center gap-3 text-sm text-slate-700">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <Calendar className="h-5 w-5 text-primary shrink-0" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-900 text-sm">
                        {event.start_date ? format(new Date(event.start_date), 'dd MMM yyyy') : '-'} 
                      </span>
                      <span className="text-xs text-slate-500 mt-0.5">
                        sampai {event.end_date ? format(new Date(event.end_date), 'dd MMM yyyy') : '-'}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Button 
                      onClick={() => handleEdit(event)}
                      variant="default" 
                      className="w-full h-10 rounded-xl text-sm font-semibold bg-primary hover:bg-primary/90 text-white shadow-sm"
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button 
                      onClick={() => handleDelete(event.id, event.name)}
                      variant="outline" 
                      className="w-full h-10 rounded-xl text-sm font-semibold border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Hapus
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop View: Table */}
          <div className="hidden md:block rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-base">Nama Event</TableHead>
                  <TableHead className="text-base">Tanggal Mulai</TableHead>
                  <TableHead className="text-base">Tanggal Selesai</TableHead>
                  <TableHead className="text-base">Lokasi</TableHead>
                  <TableHead className="text-base">Status</TableHead>
                  <TableHead className="text-right text-base">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                      Belum ada data event.
                    </TableCell>
                  </TableRow>
                ) : (
                  events
                    ?.filter((e) => e.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="font-bold text-base text-slate-800">{event.name}</TableCell>
                      <TableCell className="text-base">{event.start_date || '-'}</TableCell>
                      <TableCell className="text-base">{event.end_date || '-'}</TableCell>
                      <TableCell className="text-base">{event.location || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={event.status === 'Upcoming' ? 'default' : 'secondary'} className="text-sm text-white">
                        {event.status || 'Draft'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button onClick={() => handleEdit(event)} variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-primary">
                        <Edit2 className="h-5 w-5" />
                      </Button>
                      <Button onClick={() => handleDelete(event.id, event.name)} variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:text-destructive/90">
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {/* Edit Dialog */}
      <EventDialog 
        open={isEditDialogOpen} 
        onOpenChange={setIsEditDialogOpen} 
        initialData={editingEvent ? {
          ...editingEvent,
          description: editingEvent.description || undefined,
          start_date: editingEvent.start_date || '',
          end_date: editingEvent.end_date || '',
          location: editingEvent.location || '',
        } : undefined} 
      />
    </>
  );
}
