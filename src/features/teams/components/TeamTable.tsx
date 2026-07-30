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
import { Button } from '@/components/ui/button';
import { Edit2, Trash2, Users } from 'lucide-react';

type TeamRow = {
  id: string;
  name: string;
  captain: string | null;
  competitions: { title: string } | null;
  registrations: { id: string }[];
};

export function TeamTable() {
  const queryClient = useQueryClient();

  const { data: teams, isLoading, error } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      // To get members count, we might query registrations associated with the team
      // For MVP, if registrations structure allows mapping team members, we count them.
      // But based on schema, `registrations` link participant to team. 
      const { data, error } = await supabase
        .from('teams')
        .select(`
          *,
          competitions(title),
          registrations(id)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as TeamRow[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel('realtime-teams')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'teams' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['teams'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  if (isLoading) {
    return <div className="p-4 text-center text-muted-foreground">Memuat data tim...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-destructive">Gagal memuat data tim.</div>;
  }

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama Tim</TableHead>
            <TableHead>Lomba</TableHead>
            <TableHead>Ketua Tim</TableHead>
            <TableHead>Jml Anggota</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {teams?.map((team) => (
            <TableRow key={team.id}>
              <TableCell className="font-medium">{team.name}</TableCell>
              <TableCell className="text-muted-foreground">{team.competitions?.title || '-'}</TableCell>
              <TableCell>{team.captain || '-'}</TableCell>
              <TableCell>{team.registrations?.length || 0} orang</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                  <Users className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive/90">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {(!teams || teams.length === 0) && (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                Belum ada data tim.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
