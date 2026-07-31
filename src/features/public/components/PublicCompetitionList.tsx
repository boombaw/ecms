'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toTitleCase } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PublicRegistrationDialog } from './PublicRegistrationDialog';
import { PublicParticipantsDialog } from './PublicParticipantsDialog';
import { Calendar, PenTool, Search, Users } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

type CompetitionPublic = {
  id: string;
  title: string;
  category_id: string;
  status: string;
  schedule: string | null;
  competition_type: string;
  team_registration_mode: string | null;
  events: { name: string } | null;
  registrations: { id: string }[];
  max_participants: number | null;
};

export function PublicCompetitionList() {
  const [competitions, setCompetitions] = useState<CompetitionPublic[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Registration Dialog State
  const [selectedCompId, setSelectedCompId] = useState<string>('');
  const [selectedCompTitle, setSelectedCompTitle] = useState<string>('');
  const [selectedCompType, setSelectedCompType] = useState<string>('');
  const [selectedCompMode, setSelectedCompMode] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<string>('Semua');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isParticipantsDialogOpen, setIsParticipantsDialogOpen] = useState(false);

  useEffect(() => {
    const fetchCompetitions = async () => {
      try {
        const { data, error } = await supabase
          .from('competitions')
          .select(`
            id, title, category_id, status, schedule, max_participants, competition_type, team_registration_mode,
            events(name),
            registrations(id)
          `)
          .order('schedule', { ascending: true, nullsFirst: false });

        if (error) throw error;
        
        const formattedData = (data as unknown as CompetitionPublic[]).map(comp => ({
          ...comp,
          title: toTitleCase(comp.title),
          events: comp.events ? {
            ...comp.events,
            name: toTitleCase(comp.events.name)
          } : null
        }));
        
        setCompetitions(formattedData);
      } catch (err) {
        console.error('Error fetching competitions:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompetitions();

    // Listen to real-time changes on public schema (so events and competitions trigger it)
    const channel = supabase
      .channel('public-competitions-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        () => {
          fetchCompetitions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleRegisterClick = (comp: CompetitionPublic) => {
    setSelectedCompId(comp.id);
    setSelectedCompTitle(comp.title + (comp.category_id ? ` (${comp.category_id})` : ''));
    
    // Normalize type in case old data has 'Individu'/'Team'
    const normalizedType = comp.competition_type.toLowerCase() === 'team' ? 'team' : 
                          comp.competition_type.toLowerCase() === 'individu' ? 'individual' : 
                          comp.competition_type;
    
    setSelectedCompType(normalizedType);
    setSelectedCompMode(comp.team_registration_mode);
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return <div className="text-center py-12 text-slate-500 animate-pulse">Memuat daftar lomba...</div>;
  }

  if (competitions.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
        <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500 font-medium">Belum ada jadwal lomba terdekat.</p>
      </div>
    );
  }

  const categories = Array.from(new Set(competitions.map(c => c.category_id).filter(Boolean))) as string[];

  const filteredCompetitions = competitions.filter((c) => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.events?.name && c.events.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(c.category_id);
    const matchesType = selectedType === 'Semua' || 
      (selectedType === 'Individu' && c.competition_type.toLowerCase() === 'individu') ||
      (selectedType === 'Team' && c.competition_type.toLowerCase() === 'team');
    return matchesSearch && matchesCategory && matchesType;
  });

  return (
    <>
      <div className="mb-4 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
        <Input
          type="text"
          placeholder="Cari nama lomba atau nama event..."
          className="!pl-12 h-14 rounded-2xl border-outline-variant bg-white text-base shadow-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <span className="text-sm font-medium text-slate-500 mr-1">Tipe:</span>
        {['Semua', 'Individu', 'Team'].map((t) => (
          <Button
            key={t}
            variant={selectedType === t ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedType(t)}
            className={`rounded-full ${selectedType === t ? "text-white" : ""}`}
          >
            {t}
          </Button>
        ))}
      </div>

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
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
            let clsButton = "rounded-full";

            clsButton += isSelected ? " text-white " : "";

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
                className={clsButton}
              >
                {category}
              </Button>
            );
          })}
        </div>
      )}

      <div className="grid gap-4">
        {filteredCompetitions.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
            <p className="text-slate-500 font-medium">Lomba tidak ditemukan.</p>
          </div>
        ) : (
          filteredCompetitions.map((comp) => {
            const isRegistrationOpen = comp.status === 'Draft' || comp.status === 'Registration';

            return (
              <Card key={comp.id} className="border-2 border-slate-100 shadow-sm hover:border-primary/50 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-3">
                    <div>
                      <CardTitle className="text-xl md:text-2xl font-bold text-slate-800 flex items-center flex-wrap gap-2">
                        <span>{comp.title}</span>
                        {(comp.competition_type.toLowerCase() === 'individu') && <span className="text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-600 rounded-md border">👤 Individu</span>}
                        {(comp.competition_type.toLowerCase() === 'team') && (
                          <span className="text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-600 rounded-md border flex items-center gap-1">
                            👥 Kelompok - {comp.team_registration_mode === 'existing' ? '🏷 Tim Sendiri' : '🎲 Tim Diacak Panitia'}
                          </span>
                        )}
                      </CardTitle>
                      <CardDescription className="text-base mt-1 text-slate-600 font-medium">
                        {comp.events?.name || 'Event Umum'}
                      </CardDescription>
                      {comp.category_id && (
                        <div className="mt-2">
                          <span className="text-sm font-semibold px-2.5 py-1 bg-primary/10 text-primary rounded-md">{comp.category_id}</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <span className={`px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wide
                        ${isRegistrationOpen ? 'bg-green-100 text-green-700' : 
                          comp.status === 'Finished' ? 'bg-slate-200 text-slate-700' : 'bg-blue-100 text-blue-700'}
                      `}>
                        {isRegistrationOpen ? 'Pendaftaran Buka' : 
                         comp.status === 'Finished' ? 'Selesai' : 'Segera Mulai'}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mt-2 p-4 bg-slate-50 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-slate-500 uppercase tracking-wider font-semibold mb-1">Jadwal Pelaksanaan</p>
                        <p className="font-bold text-slate-800 text-lg flex items-center">
                          <Calendar className="w-5 h-5 mr-2 text-slate-400" />
                          {comp.schedule ? format(parseISO(comp.schedule), "EEEE, dd MMMM yyyy", { locale: id }) : 'Belum Ditentukan'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 uppercase tracking-wider font-semibold mb-1">Peserta Saat Ini</p>
                        <button 
                          onClick={() => {
                            setSelectedCompId(comp.id);
                            setSelectedCompTitle(comp.title);
                            setIsParticipantsDialogOpen(true);
                          }}
                          className="font-bold text-primary flex items-center hover:bg-primary/10 px-2 py-1 -ml-2 rounded-lg transition-colors cursor-pointer text-left"
                          title="Lihat Daftar Peserta"
                        >
                          <Users className="w-5 h-5 mr-2" />
                          {comp.registrations?.length || 0} {comp.max_participants ? `/ ${comp.max_participants}` : ''} Terdaftar
                        </button>
                      </div>
                    </div>

                    {isRegistrationOpen && (
                      <Button
                        onClick={() => handleRegisterClick(comp)}
                        className="bg-primary text-on-primary rounded-xl h-12 px-6 shadow-md hover:shadow-lg active:scale-95 transition-all w-full sm:w-auto"
                      >
                        <PenTool className="w-5 h-5 mr-2" />
                        {(comp.competition_type.toLowerCase() === 'individu') ? 'Daftar Individu' : 
                         comp.team_registration_mode === 'existing' ? 'Daftar Tim' : 'Daftar Peserta'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          }))}
      </div>

      <PublicRegistrationDialog
        competitionId={selectedCompId}
        competitionTitle={selectedCompTitle}
        competitionType={selectedCompType}
        teamRegistrationMode={selectedCompMode}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSuccess={() => {
          // Success is handled inside the dialog visually
        }}
      />

      <PublicParticipantsDialog
        competitionId={selectedCompId}
        competitionTitle={selectedCompTitle}
        isOpen={isParticipantsDialogOpen}
        onClose={() => setIsParticipantsDialogOpen(false)}
      />
    </>
  );
}
