'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';
import { toTitleCase } from '@/lib/utils';
import { Users, Home, Phone, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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

interface PublicParticipantsDialogProps {
  competitionId: string;
  competitionTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export function PublicParticipantsDialog({
  competitionId,
  competitionTitle,
  isOpen,
  onClose,
}: PublicParticipantsDialogProps) {
  const [individuals, setIndividuals] = useState<ParticipantData[]>([]);
  const [teams, setTeams] = useState<TeamData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !competitionId) return;

    let isMounted = true;

    const fetchParticipants = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('registrations')
          .select(`
            id, team_id,
            participants(id, full_name, phone, address, note),
            teams(id, name)
          `)
          .eq('competition_id', competitionId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        if (isMounted) {
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
        }
      } catch (err) {
        console.error('Error fetching participants:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchParticipants();

    const channel = supabase
      .channel(`public-participants-${competitionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'registrations',
          filter: `competition_id=eq.${competitionId}`,
        },
        () => {
          fetchParticipants();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [competitionId, isOpen]);

  const totalParticipants = individuals.length + teams.reduce((acc, t) => acc + t.members.length, 0);

  const toggleTeam = (id: string) => {
    setExpandedTeamId(prev => prev === id ? null : id);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl bg-white rounded-3xl overflow-hidden p-0 gap-0 border-none shadow-2xl">
        <DialogHeader className="p-6 bg-slate-50 border-b">
          <DialogTitle className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            Peserta Terdaftar
          </DialogTitle>
          <p className="text-sm text-slate-500 font-medium">{competitionTitle}</p>
        </DialogHeader>

        <div className="p-6">
          <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4">
            <span className="text-sm font-semibold text-slate-700">Total Peserta</span>
            <Badge variant="default" className="text-sm px-3 py-1 bg-primary text-white">
              {isLoading ? '...' : totalParticipants}
            </Badge>
          </div>

          <div className="h-[380px] pr-2 overflow-y-auto">
            {isLoading ? (
              <div className="text-center py-8 text-slate-500 animate-pulse">Memuat daftar peserta...</div>
            ) : totalParticipants === 0 ? (
              <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                Belum ada peserta yang terdaftar di lomba ini.
              </div>
            ) : (
              <div className="space-y-4">
                {/* Render Teams */}
                {teams.length > 0 && (
                  <div className="space-y-3">
                    {teams.map((team) => (
                      <div key={team.id} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                        <button 
                          className="w-full flex items-center justify-between p-4 bg-white hover:bg-slate-50 transition-colors"
                          onClick={() => toggleTeam(team.id)}
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-lg text-slate-800">{team.name}</span>
                            <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-600">
                              {team.members.length} Anggota
                            </Badge>
                          </div>
                          {expandedTeamId === team.id ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                        </button>
                        
                        {expandedTeamId === team.id && (
                          <div className="p-4 bg-slate-50 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {team.members.map((member) => (
                              <div key={member.id} className="bg-white p-3 rounded-lg shadow-sm border border-slate-100">
                                <h4 className="font-semibold text-slate-800 text-sm mb-1">{member.full_name}</h4>
                                {member.address && (
                                  <div className="flex items-start gap-1.5 text-slate-500 text-xs">
                                    <Home className="w-3 h-3 mt-[1px] shrink-0" />
                                    <span className="line-clamp-2">{member.address}</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Render Individuals */}
                {individuals.length > 0 && (
                  <div>
                    {teams.length > 0 && <h3 className="font-semibold text-slate-700 mb-3 mt-6">Peserta Individu</h3>}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {individuals.map((ind) => (
                        <div key={ind.id} className="relative overflow-hidden rounded-xl shadow-md group bg-[#E3242B] aspect-[1.6/1]">
                          <div 
                            className="absolute inset-0 bg-cover bg-center  opacity-50 transition-opacity duration-300 group-hover:opacity-70"
                            style={{ backgroundImage: "url('/assets/card_background.png')" }}
                          ></div>
                          
                          <div className="relative flex flex-col h-full p-4"> 
                            <div className="mb-2 mt-4">
                              <h3 className="font-bold text-xl text-white leading-tight line-clamp-2 drop-shadow-md">
                                {ind.full_name}
                              </h3>
                            </div>
                            
                            {ind.note && (
                              <div className="flex items-center gap-2 text-white/90 mt-1">
                                <FileText className="h-4 w-4 shrink-0" />
                                <span className="text-sm truncate drop-shadow-sm italic">{ind.note}</span>
                              </div>
                            )}
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
