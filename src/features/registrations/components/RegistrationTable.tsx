'use client';

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
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
import { Trash2 } from 'lucide-react';
import { format } from 'date-fns';

type RegistrationRow = {
  id: string;
  created_at: string;
  competitions: { title: string; type: string } | null;
  participants: { full_name: string } | null;
  teams: { name: string } | null;
};

export function RegistrationTable() {
  const queryClient = useQueryClient();

  const { data: registrations, isLoading, error } = useQuery({
    queryKey: ['registrations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('registrations')
        .select(`
          id, created_at,
          competitions(title, type),
          participants(full_name),
          teams(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as RegistrationRow[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel('realtime-registrations')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'registrations' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['registrations'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  if (isLoading) {
    return <div className="p-4 text-center text-muted-foreground">Memuat data pendaftaran...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-destructive">Gagal memuat data pendaftaran.</div>;
  }

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Lomba</TableHead>
            <TableHead>Tipe</TableHead>
            <TableHead>Peserta / Tim</TableHead>
            <TableHead>Tanggal Daftar</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {registrations?.map((reg) => (
            <TableRow key={reg.id}>
              <TableCell className="font-medium">{reg.competitions?.title || '-'}</TableCell>
              <TableCell>{reg.competitions?.type || '-'}</TableCell>
              <TableCell>
                {reg.participants?.full_name || reg.teams?.name || '-'}
              </TableCell>
              <TableCell>{format(new Date(reg.created_at), 'dd MMM yyyy')}</TableCell>
              <TableCell>
                <Badge variant="default" className='text-white'>Terdaftar</Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive/90">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {(!registrations || registrations.length === 0) && (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                Belum ada data pendaftaran.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
