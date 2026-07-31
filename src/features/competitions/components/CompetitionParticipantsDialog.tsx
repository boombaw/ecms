import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';
import { toTitleCase } from '@/lib/utils';
import { Phone, Users, Home, FileText, ChevronDown, ChevronUp, Shuffle, Edit2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import namaPahlawanList from '@/lib/nama_pahlawan.json';

interface ParticipantData {
  id: string;
  full_name: string;
  phone: string | null;
  address: string | null;
  note: string | null;
}

interface TeamData {
  id: string;
  name: string;
  members: ParticipantData[];
}

interface CompetitionParticipantsDialogProps {
  competitionId: string | null;
  competitionTitle: string;
  competitionCategory?: string;
  competitionType?: string; // Add this to know if it's a team competition
  isOpen: boolean;
  onClose: () => void;
}

export function CompetitionParticipantsDialog({
  competitionId,
  competitionTitle,
  competitionCategory,
  competitionType,
  isOpen,
  onClose
}: CompetitionParticipantsDialogProps) {
  const [individuals, setIndividuals] = useState<ParticipantData[]>([]);
  const [teams, setTeams] = useState<TeamData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);

  useEffect(() => {
    if (!competitionId || !isOpen) return;

    const fetchParticipants = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('registrations')
          .select(`
            id, created_at, team_id,
            participants ( id, full_name, phone, address, note ),
            teams ( id, name )
          `)
          .eq('competition_id', competitionId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        const inds: ParticipantData[] = [];
        const tMap = new Map<string, TeamData>();

        (data as any[]).forEach(reg => {
          if (!reg.participants) return;
          
          const participant: ParticipantData = {
            ...reg.participants,
            full_name: toTitleCase(reg.participants.full_name),
            address: reg.participants.address ? toTitleCase(reg.participants.address) : null,
          };

          if (reg.team_id && reg.teams) {
            if (!tMap.has(reg.team_id)) {
              tMap.set(reg.team_id, {
                id: reg.team_id,
                name: toTitleCase(reg.teams.name),
                members: []
              });
            }
            tMap.get(reg.team_id)!.members.push(participant);
          } else {
            inds.push(participant);
          }
        });

        setIndividuals(inds);
        setTeams(Array.from(tMap.values()));
      } catch (err) {
        console.error('Error fetching participants:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchParticipants();

    const channel = supabase
      .channel(`realtime-comp-participants-${competitionId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'registrations', filter: `competition_id=eq.${competitionId}` },
        () => {
          fetchParticipants();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [competitionId, isOpen]);

  const totalParticipants = individuals.length + teams.reduce((acc, t) => acc + t.members.length, 0);

  const toggleTeam = (id: string) => {
    setExpandedTeamId(prev => prev === id ? null : id);
  };

  const handleGenerateTeams = async (isReshuffle: boolean = false) => {
    const participantsToGroup = isReshuffle 
      ? [...individuals, ...teams.flatMap(t => t.members)]
      : individuals;

    if (participantsToGroup.length === 0) {
      alert('Tidak ada peserta untuk diacak.');
      return;
    }

    const input = prompt('Berapa jumlah anggota per tim?', '5');
    if (!input) return;
    
    const teamSize = parseInt(input, 10);
    if (isNaN(teamSize) || teamSize < 2) {
      alert('Jumlah anggota tidak valid (minimal 2)');
      return;
    }

    const message = isReshuffle 
      ? `Acak Ulang: Membentuk ulang tim untuk total ${participantsToGroup.length} peserta. Tim sebelumnya akan dihapus. Lanjutkan?`
      : `Membentuk tim dengan ${teamSize} anggota per tim dari ${participantsToGroup.length} peserta individu. Lanjutkan?`;

    if (!confirm(message)) return;
    
    setIsLoading(true);
    try {
      // Shuffle individuals
      const shuffled = [...participantsToGroup].sort(() => 0.5 - Math.random());
      const numTeams = Math.ceil(shuffled.length / teamSize);
      
      const availableNames = [...namaPahlawanList].sort(() => 0.5 - Math.random());
      
      for (let i = 0; i < numTeams; i++) {
        const members = shuffled.slice(i * teamSize, (i + 1) * teamSize);
        const teamName = availableNames[i] ? `Tim ${availableNames[i].nama}` : `Tim Acak ${Date.now().toString().slice(-4)} - ${i + 1}`;
        
        // Create Team
        const { data: teamData, error: tErr } = await supabase
          .from('teams')
          .insert({ name: teamName, competition_id: competitionId })
          .select('id')
          .single();
          
        if (tErr) throw tErr;
        
        // Update Registrations
        const memberIds = members.map(m => m.id);
        const { error: rErr } = await supabase
          .from('registrations')
          .update({ team_id: teamData.id })
          .in('participant_id', memberIds)
          .eq('competition_id', competitionId);
          
        if (rErr) throw rErr;
      }
      
      if (isReshuffle && teams.length > 0) {
        // Delete old teams
        const oldTeamIds = teams.map(t => t.id);
        const { error: delErr } = await supabase.from('teams').delete().in('id', oldTeamIds);
        if (delErr) throw delErr;
      }
      
      // The realtime subscription will automatically refresh the list!
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Terjadi kesalahan saat mengacak tim');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRenameTeam = async (teamId: string, currentName: string) => {
    const newName = prompt('Ubah nama tim:', currentName);
    if (!newName || newName === currentName) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('teams')
        .update({ name: newName })
        .eq('id', teamId);
        
      if (error) throw error;
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah nama tim');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl bg-surface rounded-3xl p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="p-6 pb-4 bg-slate-50 border-b">
          <DialogTitle className="text-xl md:text-2xl font-bold flex items-center gap-2 text-slate-800">
            <Users className="w-6 h-6 text-primary" />
            Detail Peserta Lomba
          </DialogTitle>
          <div className="flex flex-col gap-1 mt-2">
            <p className="text-sm text-slate-500 font-medium">{competitionTitle}</p>
            {competitionCategory && (
              <Badge variant="outline" className="w-fit text-xs bg-slate-100 text-slate-600 border-slate-200">
                Kategori: {competitionCategory}
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="p-6">
          <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4">
            <span className="text-sm font-semibold text-slate-700">Total Peserta Saat Ini</span>
            <Badge variant="default" className="text-sm px-3 py-1 bg-primary text-white">
              {isLoading ? '...' : totalParticipants}
            </Badge>
          </div>

          <div className="h-[400px] pr-2 overflow-y-auto">
            {isLoading ? (
              <div className="text-center py-8 text-slate-500 animate-pulse">Memuat daftar peserta...</div>
            ) : totalParticipants === 0 ? (
              <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                Belum ada peserta yang mendaftar di lomba ini.
              </div>
            ) : (
              <div className="space-y-4">
                {/* Render Teams */}
                {teams.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-slate-700">Daftar Tim</h3>
                      {competitionType?.toLowerCase() === 'team' && (
                        <Button 
                          onClick={() => handleGenerateTeams(true)} 
                          variant="outline" 
                          size="sm"
                          className="h-8 border-primary text-primary hover:bg-primary hover:text-white"
                          disabled={isLoading}
                        >
                          <Shuffle className="w-3.5 h-3.5 mr-1.5" />
                          Acak Ulang Semua Tim
                        </Button>
                      )}
                    </div>
                    {teams.map((team) => (
                      <div key={team.id} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                        <div 
                          className="w-full flex items-center justify-between p-4 bg-white hover:bg-slate-50 transition-colors focus:outline-none cursor-pointer"
                          onClick={() => toggleTeam(team.id)}
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-lg text-slate-800">{team.name}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-7 h-7 text-slate-400 hover:text-primary hover:bg-primary/10"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRenameTeam(team.id, team.name);
                              }}
                              title="Ubah Nama Tim"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                            <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-600">
                              {team.members.length} Anggota
                            </Badge>
                          </div>
                          {expandedTeamId === team.id ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                        </div>
                        
                        {expandedTeamId === team.id && (
                          <div className="p-4 bg-slate-50 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-3">
                            {team.members.map((member) => (
                              <div key={member.id} className="bg-white p-3 rounded-lg shadow-sm border border-slate-100">
                                <h4 className="font-semibold text-slate-800 text-sm mb-2">{member.full_name}</h4>
                                <div className="space-y-1">
                                  {member.address && (
                                    <div className="flex items-start gap-2 text-slate-500 text-xs">
                                      <Home className="w-3 h-3 mt-0.5 shrink-0" />
                                      <span className="line-clamp-2">{member.address}</span>
                                    </div>
                                  )}
                                  {member.phone && (
                                    <div className="flex items-center gap-2 text-slate-500 text-xs">
                                      <Phone className="w-3 h-3 shrink-0" />
                                      <span>{member.phone}</span>
                                    </div>
                                  )}
                                  {member.note && (
                                    <div className="flex items-start gap-2 text-slate-400 text-xs mt-1">
                                      <FileText className="w-3 h-3 mt-0.5 shrink-0" />
                                      <span className="italic line-clamp-2">{member.note}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Render Individuals (if any) */}
                {individuals.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-4 mt-6">
                      <h3 className="font-semibold text-slate-700">{teams.length > 0 ? 'Peserta Individu / Belum Punya Tim' : 'Peserta Terdaftar'}</h3>
                      {competitionType?.toLowerCase() === 'team' && (
                        <Button 
                          onClick={() => handleGenerateTeams(false)} 
                          variant="outline" 
                          size="sm"
                          className="h-8 border-primary text-primary hover:bg-primary hover:text-white"
                          disabled={isLoading}
                        >
                          <Shuffle className="w-3.5 h-3.5 mr-1.5" />
                          Acak Tim Otomatis
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {individuals.map((ind) => (
                        <div key={ind.id} className="relative overflow-hidden rounded-xl shadow-md group bg-[#E3242B] aspect-[1.6/1]">
                          <div 
                            className="absolute inset-0 bg-cover bg-center   opacity-50"
                            style={{ backgroundImage: "url('/assets/card_background.png')" }}
                          ></div>
                          
                          <div className="relative flex flex-col h-full p-4"> 
                            <div className="mb-2 mt-2">
                              <h3 className="font-bold text-xl text-white mb-1 leading-tight line-clamp-2 drop-shadow-md">
                                {ind.full_name}
                              </h3>
                            </div>
                            
                            <div className="flex flex-col gap-2 mb-1 mt-auto">
                              {ind.address && (
                                <div className="flex items-center gap-2 text-white">
                                  <Home className="h-4 w-4 shrink-0" />
                                  <span className="text-sm truncate drop-shadow-sm">{ind.address}</span>
                                </div>
                              )}
                              {ind.phone && (
                                <div className="flex items-center gap-2 text-white">
                                  <Phone className="h-4 w-4 shrink-0" />
                                  <span className="text-sm truncate drop-shadow-sm">{ind.phone}</span>
                                </div>
                              )}
                              {ind.note && (
                                <div className="flex items-center gap-2 text-white/90">
                                  <FileText className="h-4 w-4 shrink-0" />
                                  <span className="text-sm truncate drop-shadow-sm italic">{ind.note}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
