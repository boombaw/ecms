import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';
import { toTitleCase } from '@/lib/utils';
import { Phone, Users, Home, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface RegistrationData {
  id: string;
  created_at: string;
  participants: {
    id: string;
    full_name: string;
    phone: string | null;
    address: string | null;
    note: string | null;
  } | null;
}

interface CompetitionParticipantsDialogProps {
  competitionId: string | null;
  competitionTitle: string;
  competitionCategory?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function CompetitionParticipantsDialog({
  competitionId,
  competitionTitle,
  competitionCategory,
  isOpen,
  onClose
}: CompetitionParticipantsDialogProps) {
  const [registrations, setRegistrations] = useState<RegistrationData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!competitionId || !isOpen) return;

    const fetchParticipants = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('registrations')
          .select(`
            id, created_at,
            participants ( id, full_name, phone, address, note )
          `)
          .eq('competition_id', competitionId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        const formattedData = (data as unknown as RegistrationData[]).map(reg => ({
          ...reg,
          participants: reg.participants ? {
            ...reg.participants,
            full_name: toTitleCase(reg.participants.full_name),
            address: reg.participants.address ? toTitleCase(reg.participants.address) : null,
            note: reg.participants.note
          } : null
        }));
        setRegistrations(formattedData);
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            Detail Peserta Lomba
          </DialogTitle>
          <div className="flex flex-col gap-1">
            <p className="text-sm text-slate-500 font-medium">{competitionTitle}</p>
            {competitionCategory && (
              <Badge variant="outline" className="w-fit text-xs bg-slate-100 text-slate-600 border-slate-200">
                Kategori: {competitionCategory}
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="mt-2">
          <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4">
            <span className="text-sm font-semibold text-slate-700">Total Peserta Saat Ini</span>
            <Badge variant="default" className="text-sm px-3 py-1 bg-primary text-white">
              {isLoading ? '...' : registrations.length}
            </Badge>
          </div>

          <div className="h-[400px] pr-4 overflow-y-auto">
            {isLoading ? (
              <div className="text-center py-8 text-slate-500 animate-pulse">Memuat daftar peserta...</div>
            ) : registrations.length === 0 ? (
              <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                Belum ada peserta yang mendaftar di lomba ini.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {registrations.map((reg) => (
                  <div key={reg.id} className="relative overflow-hidden rounded-xl shadow-lg group bg-[#E3242B] aspect-[1.6/1]">
                    {/* Background Pattern */}
                    <div 
                      className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-50"
                      style={{ backgroundImage: "url('/assets/card_background.png')" }}
                    ></div>
                    
                    <div className="relative flex flex-col h-full p-5"> 
                      
                      {/* Participant Info */}
                      <div className="mb-3 mt-4">
                        <h3 className="font-bold text-2xl text-white mb-1 leading-tight line-clamp-2 drop-shadow-md">
                          {reg.participants?.full_name}
                        </h3>
                      </div>
                      
                      {/* Contact & Address */}
                      <div className="flex flex-col gap-2 mb-2 mt-auto">
                        <div className="flex items-center gap-3 text-white">
                          <Home className="h-4 w-4 shrink-0" />
                          <span className="text-sm truncate drop-shadow-sm">{reg.participants?.address || '-'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-white">
                          <Phone className="h-4 w-4 shrink-0" />
                          <span className="text-sm truncate drop-shadow-sm">{reg.participants?.phone || '-'}</span>
                        </div>
                        {reg.participants?.note && (
                          <div className="flex items-center gap-3 text-white/90">
                            <FileText className="h-4 w-4 shrink-0" />
                            <span className="text-sm truncate drop-shadow-sm italic">{reg.participants.note}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
