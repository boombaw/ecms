'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';
import { toTitleCase } from '@/lib/utils';
import { Users, Home, Phone, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface RegistrationData {
  id: string;
  participants: {
    full_name: string;
    phone: string | null;
    address: string | null;
    note: string | null;
  } | null;
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
  const [registrations, setRegistrations] = useState<RegistrationData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !competitionId) return;

    let isMounted = true;

    const fetchParticipants = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('registrations')
          .select(`
            id,
            participants(full_name, phone, address, note)
          `)
          .eq('competition_id', competitionId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        if (isMounted) {
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-white rounded-3xl overflow-hidden p-0 gap-0 border-none shadow-2xl">
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
              {isLoading ? '...' : registrations.length}
            </Badge>
          </div>

          <div className="h-[350px] pr-2 overflow-y-auto">
            {isLoading ? (
              <div className="text-center py-8 text-slate-500 animate-pulse">Memuat daftar peserta...</div>
            ) : registrations.length === 0 ? (
              <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                Belum ada peserta yang terdaftar di lomba ini.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {registrations.map((reg) => (
                  <div key={reg.id} className="relative overflow-hidden rounded-xl shadow-md group bg-[#E3242B] aspect-[1.6/1]">
                    {/* Background Pattern */}
                    <div 
                      className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-50 transition-opacity duration-300 group-hover:opacity-70"
                      style={{ backgroundImage: "url('/assets/card_background.png')" }}
                    ></div>
                    
                    <div className="relative flex flex-col h-full p-4"> 
                      
                      {/* Participant Info */}
                      <div className="mb-2 mt-4">
                        <h3 className="font-bold text-xl text-white leading-tight line-clamp-2 drop-shadow-md">
                          {reg.participants?.full_name}
                        </h3>
                      </div>
                      
                      {reg.participants?.note && (
                        <div className="flex items-center gap-2 text-white/90 mt-1">
                          <FileText className="h-4 w-4 shrink-0" />
                          <span className="text-sm truncate drop-shadow-sm italic">{reg.participants.note}</span>
                        </div>
                      )}
                       
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
