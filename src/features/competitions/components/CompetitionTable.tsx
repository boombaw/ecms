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
import { Edit2, Trash2, Users, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { CompetitionDialog } from './CompetitionDialog';
import { CompetitionParticipantsDialog } from './CompetitionParticipantsDialog';

type CompetitionRow = {
  id: string;
  event_id: string;
  category_id: string;
  title: string;
  competition_type: 'individual' | 'team';
  team_registration_mode: 'existing' | 'random' | null;
  schedule: string | null;
  location: string | null;
  max_participants: number | null;
  status: 'Draft' | 'Registration' | 'Ongoing' | 'Finished';
  notes: string | null;
  events: { name: string } | null;
  registrations: { id: string }[];
};

export function CompetitionTable() {
  const queryClient = useQueryClient();
  const [editingCompetition, setEditingCompetition] = useState<CompetitionRow | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [participantsDialogComp, setParticipantsDialogComp] = useState<{ id: string, title: string, category_id?: string, competition_type?: string } | null>(null);

  const { data: competitions, isLoading, error } = useQuery({
    queryKey: ['competitions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('competitions')
        .select('*, events(name), registrations(id)')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data as CompetitionRow[]).map(row => ({
        ...row,
        title: toTitleCase(row.title),
        location: row.location ? toTitleCase(row.location) : null,
        events: row.events ? {
          ...row.events,
          name: toTitleCase(row.events.name)
        } : null
      }));
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel('realtime-competitions')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'competitions' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['competitions'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus lomba "${title}"?`)) {
      const { error } = await supabase.from('competitions').delete().eq('id', id);
      if (error) {
        alert('Gagal menghapus lomba: ' + error.message);
      } else {
        queryClient.invalidateQueries({ queryKey: ['competitions'] });
      }
    }
  };

  const handleEdit = (comp: CompetitionRow) => {
    setEditingCompetition({
      ...comp,
      schedule: comp.schedule || '',
      location: comp.location || '',
      notes: comp.notes || '',
    });
    setIsEditDialogOpen(true);
  };

  if (isLoading) {
    return <div className="p-8 text-center text-lg text-muted-foreground">Memuat data lomba...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-lg text-destructive">Gagal memuat data lomba.</div>;
  }

  return (
    <>
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex justify-between items-center hidden md:flex">
          <h2 className="text-2xl font-bold text-on-surface">Daftar Lomba</h2>
          <CompetitionDialog />
        </div>
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Cari nama lomba atau nama event..."
            className="pl-10 h-12 rounded-xl border-outline-variant bg-surface"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {(() => {
          const categories = Array.from(new Set(competitions?.map(c => c.category_id).filter(Boolean))) as string[];
          if (categories.length === 0) return null;
          return (
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategories.length === 0 ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategories([])}
                className={`rounded-full ${selectedCategories.length === 0 ? "text-white" : ""}`}
              >
                Semua
              </Button>
              {categories.map((category) => {
                const isSelected = selectedCategories.includes(category);
                return (
                  <Button
                    key={category}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      if (isSelected) {
                        setSelectedCategories(selectedCategories.filter(c => c !== category));
                      } else {
                        setSelectedCategories([...selectedCategories, category]);
                      }
                    }}
                    className={`rounded-full ${isSelected ? "text-white" : ""}`}
                  >
                    {category}
                  </Button>
                );
              })}
            </div>
          );
        })()}
      </div>

      {!competitions || competitions.length === 0 ? (
        <div className="p-8 text-center text-lg text-muted-foreground border rounded-xl bg-card">
          Belum ada data lomba.
        </div>
      ) : (
        <>
          {/* Mobile View: Cards */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {competitions
              ?.filter((c) => {
                const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  (c.events?.name && c.events.name.toLowerCase().includes(searchQuery.toLowerCase()));
                const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(c.category_id);
                return matchesSearch && matchesCategory;
              })
              .map((comp) => (
                <Card
                  key={comp.id}
                  className="overflow-hidden border shadow-sm rounded-xl bg-white cursor-pointer hover:border-primary/50"
                  onClick={() => setParticipantsDialogComp({ id: comp.id, title: comp.title, category_id: comp.category_id, competition_type: comp.competition_type })}
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-lg text-slate-800 leading-tight">{comp.title}</h3>
                          <p className="text-sm text-slate-500 mt-1 font-medium">{comp.events?.name || '-'}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
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

                    <div className="flex items-center gap-4 text-sm bg-slate-50 p-3 rounded-xl">
                      <div className="flex flex-col">
                        <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Tipe Lomba</span>
                        <span className="font-bold text-slate-900 mt-1">
                          {comp.competition_type.toLowerCase() === 'individu' || comp.competition_type.toLowerCase() === 'individual' ? 'Individu' : 'Tim'}
                          {(comp.competition_type.toLowerCase() === 'team' || comp.competition_type.toLowerCase() === 'kelompok') && (
                            <Badge className="ml-2 text-[10px] px-1.5 py-0 bg-slate-100 text-slate-600 border-none" variant="outline">
                              {comp.team_registration_mode === 'existing' ? 'Tim Sendiri' : 'Tim Acak'}
                            </Badge>
                          )}
                        </span>
                      </div>
                      <div className="w-px h-8 bg-slate-200"></div>
                      <div className="flex flex-col">
                        <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Peserta Saat Ini</span>
                        <span className="font-bold text-primary mt-1 flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          {comp.registrations?.length || 0} {comp.max_participants ? `/ ${comp.max_participants}` : ''} Terdaftar
                        </span>
                      </div>
                    </div>

                    {comp.notes && (
                      <div className="text-xs text-secondary/80 mt-1">
                        <span className="font-semibold">PIC/Notes:</span> {comp.notes}
                      </div>
                    )}

                    <div className="flex gap-2 pt-1">
                      <Button
                        onClick={(e) => { e.stopPropagation(); handleEdit(comp); }}
                        variant="default"
                        className="w-full h-10 rounded-xl text-sm font-semibold bg-primary hover:bg-primary/90 text-white shadow-sm"
                      >
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        onClick={(e) => { e.stopPropagation(); handleDelete(comp.id, comp.title); }}
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
                  <TableHead className="text-base">Event / Kategori</TableHead>
                  <TableHead className="text-base">Nama Lomba</TableHead>
                  <TableHead className="text-base">Tipe</TableHead>
                  <TableHead className="text-base">Peserta Saat Ini</TableHead>
                  <TableHead className="text-base">Status</TableHead>
                  <TableHead className="text-right text-base">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {competitions
                  ?.filter((c) => {
                    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      (c.events?.name && c.events.name.toLowerCase().includes(searchQuery.toLowerCase()));
                    const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(c.category_id);
                    return matchesSearch && matchesCategory;
                  })
                  .map((comp) => (
                    <TableRow key={comp.id}>
                      <TableCell className="text-base text-muted-foreground">
                        <div className="font-medium text-slate-800">{comp.events?.name || '-'}</div>
                        <div className="text-sm">{comp.category_id || '-'}</div>
                      </TableCell>
                      <TableCell className="font-bold text-base text-slate-800">
                        {comp.title}
                        {comp.notes && <div className="text-xs text-muted-foreground font-normal mt-1">{comp.notes}</div>}
                      </TableCell>
                      <TableCell className="text-base">
                        {comp.competition_type.toLowerCase() === 'individu' || comp.competition_type.toLowerCase() === 'individual' ? 'Individu' : 'Tim'}
                        {(comp.competition_type.toLowerCase() === 'team' || comp.competition_type.toLowerCase() === 'kelompok') && (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {comp.team_registration_mode === 'existing' ? 'Tim Sendiri' : 'Tim Acak'}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-base font-medium text-primary">{comp.registrations?.length || 0} {comp.max_participants ? `/ ${comp.max_participants}` : ''} Terdaftar</TableCell>
                      <TableCell>
                        <Badge variant={comp.status === 'Registration' ? 'default' : 'secondary'} className="text-sm text-white">
                          {comp.status || 'Draft'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right flex items-center justify-end gap-1">
                        <Button onClick={() => setParticipantsDialogComp({ id: comp.id, title: comp.title, category_id: comp.category_id, competition_type: comp.competition_type })} variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-primary" title="Lihat Peserta">
                          <Users className="h-5 w-5" />
                        </Button>
                        <Button onClick={() => handleEdit(comp)} variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-primary" title="Edit">
                          <Edit2 className="h-5 w-5" />
                        </Button>
                        <Button onClick={() => handleDelete(comp.id, comp.title)} variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:text-destructive/90" title="Hapus">
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      <CompetitionDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        initialData={editingCompetition ? {
          ...editingCompetition,
          schedule: editingCompetition.schedule || '',
          location: editingCompetition.location || undefined,
          max_participants: editingCompetition.max_participants || undefined,
          notes: editingCompetition.notes || undefined,
          status: editingCompetition.status || 'Draft',
        } : undefined}
      />

      <CompetitionParticipantsDialog
        competitionId={participantsDialogComp?.id || null}
        competitionTitle={participantsDialogComp?.title || ''}
        competitionCategory={participantsDialogComp?.category_id || undefined}
        competitionType={participantsDialogComp?.competition_type || undefined}
        isOpen={!!participantsDialogComp}
        onClose={() => setParticipantsDialogComp(null)}
      />
    </>
  );
}
