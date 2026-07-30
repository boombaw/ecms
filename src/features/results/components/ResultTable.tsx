'use client';

import { useQuery } from '@tanstack/react-query';
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
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ResultDialog } from './ResultDialog';
import { Trophy } from 'lucide-react';

type CompetitionRow = {
  id: string;
  title: string;
  category_id: string;
  status: string | null;
  events: { name: string } | null;
  results: { rank: number; participants: { name: string } }[];
};

export function ResultTable() {
  const { data: competitions, isLoading, error } = useQuery({
    queryKey: ['competitions-results'],
    queryFn: async () => {
      // Kita fetch lomba dan hasil juara (beserta nama peserta)
      const { data, error } = await supabase
        .from('competitions')
        .select(`
          id, title, category_id, status,
          events(name),
          competition_results(notes, participants(full_name))
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return (data as any[]).map(comp => ({
        ...comp,
        title: toTitleCase(comp.title),
        events: comp.events ? {
          ...comp.events,
          name: toTitleCase(comp.events.name)
        } : null,
        competition_results: comp.competition_results?.map((r: any) => ({
          ...r,
          participants: r.participants ? {
            ...r.participants,
            full_name: toTitleCase(r.participants.full_name)
          } : null
        }))
      }));
    },
  });

  if (isLoading) {
    return <div className="p-8 text-center text-lg text-muted-foreground">Memuat data lomba...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-lg text-destructive">Gagal memuat data lomba.</div>;
  }

  if (!competitions || competitions.length === 0) {
    return (
      <div className="p-8 text-center text-lg text-muted-foreground border rounded-xl bg-card">
        Belum ada data lomba.
      </div>
    );
  }

  return (
    <>
      {/* Mobile View: Cards */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {competitions.map((comp) => {
          const rank1 = comp.competition_results?.find((r: any) => r.notes === '1')?.participants?.full_name;
          const rank2 = comp.competition_results?.find((r: any) => r.notes === '2')?.participants?.full_name;
          const rank3 = comp.competition_results?.find((r: any) => r.notes === '3')?.participants?.full_name;

          return (
            <Card key={comp.id} className="overflow-hidden border shadow-sm rounded-xl bg-white">
              <CardContent className="p-4 space-y-3">
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg text-slate-800 leading-tight">{comp.title}</h3>
                      <p className="text-sm text-slate-500 mt-1 font-medium">{comp.events?.name || '-'}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge className="text-xs px-2 py-0.5 w-fit rounded-md bg-primary/10 text-primary border-none" variant="outline">
                      {comp.status || 'Draft'}
                    </Badge>
                    {comp.category_id && (
                      <Badge className="text-xs px-2 py-0.5 w-fit rounded-md bg-secondary-container text-on-secondary-container border-none" variant="outline">
                        {comp.category_id}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl flex flex-col gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🥇</span>
                    <span className="font-bold text-slate-800">{rank1 || 'Belum ada'}</span>
                  </div>
                  {rank2 && (
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🥈</span>
                      <span className="font-medium text-slate-700">{rank2}</span>
                    </div>
                  )}
                  {rank3 && (
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🥉</span>
                      <span className="font-medium text-slate-700">{rank3}</span>
                    </div>
                  )}
                </div>

                <div className="pt-1">
                  <ResultDialog competitionId={comp.id} competitionTitle={comp.title} trigger={
                    <Button variant="outline" className="w-full h-10 rounded-xl text-sm font-semibold bg-amber-50 text-amber-600 hover:bg-amber-100 hover:text-amber-700 border-amber-200">
                      <Trophy className="h-4 w-4 mr-2" />
                      {comp.status === 'Finished' ? 'Edit Juara' : 'Input Juara'}
                    </Button>
                  } />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Desktop View: Table */}
      <div className="hidden md:block rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-base">Event / Kategori</TableHead>
              <TableHead className="text-base">Nama Lomba</TableHead>
              <TableHead className="text-base">Status</TableHead>
              <TableHead className="text-base">Juara 1</TableHead>
              <TableHead className="text-base">Juara 2</TableHead>
              <TableHead className="text-base">Juara 3</TableHead>
              <TableHead className="text-right text-base">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {competitions.map((comp) => {
              const rank1 = comp.competition_results?.find((r: any) => r.notes === '1')?.participants?.full_name;
              const rank2 = comp.competition_results?.find((r: any) => r.notes === '2')?.participants?.full_name;
              const rank3 = comp.competition_results?.find((r: any) => r.notes === '3')?.participants?.full_name;

              return (
                <TableRow key={comp.id}>
                  <TableCell className="text-base text-muted-foreground">
                    <div className="font-medium text-slate-800">{comp.events?.name || '-'}</div>
                    <div className="text-sm">{comp.category_id || '-'}</div>
                  </TableCell>
                  <TableCell className="font-bold text-base text-slate-800">{comp.title}</TableCell>
                  <TableCell>
                    <Badge variant={comp.status === 'Finished' ? 'default' : 'secondary'} className="text-sm">
                      {comp.status || 'Draft'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-base font-semibold text-amber-600">{rank1 || '-'}</TableCell>
                  <TableCell className="text-base text-slate-600">{rank2 || '-'}</TableCell>
                  <TableCell className="text-base text-orange-700">{rank3 || '-'}</TableCell>
                  <TableCell className="text-right">
                    <ResultDialog competitionId={comp.id} competitionTitle={comp.title} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
