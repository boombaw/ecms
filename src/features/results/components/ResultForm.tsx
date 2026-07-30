'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface ResultFormProps {
  competitionId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

type RankedParticipant = {
  rank: number;
  participant_id: string;
};

export function ResultForm({ competitionId, onSuccess, onCancel }: ResultFormProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State untuk menyimpan pilihan juara 1, 2, 3
  const [winners, setWinners] = useState<RankedParticipant[]>([
    { rank: 1, participant_id: '' },
    { rank: 2, participant_id: '' },
    { rank: 3, participant_id: '' },
  ]);

  // Fetch daftar peserta lomba ini (lewat registrations)
  const { data: participants, isLoading: isParticipantsLoading } = useQuery({
    queryKey: ['competition-participants', competitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('registrations')
        .select('id, participant_id, participants(full_name)')
        .eq('competition_id', competitionId);

      if (error) throw error;
      return data;
    },
  });

  // Fetch hasil yang sudah ada
  useQuery({
    queryKey: ['competition-results', competitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('competition_results')
        .select('*')
        .eq('competition_id', competitionId);

      if (error) throw error;
      
      if (data && data.length > 0) {
        setWinners([
          { rank: 1, participant_id: data.find(r => r.notes === '1')?.participant_id || '' },
          { rank: 2, participant_id: data.find(r => r.notes === '2')?.participant_id || '' },
          { rank: 3, participant_id: data.find(r => r.notes === '3')?.participant_id || '' },
        ]);
      }
      return data;
    },
  });

  const handleSelectWinner = (rank: number, participantId: string) => {
    setWinners((prev) =>
      prev.map((w) => (w.rank === rank ? { ...w, participant_id: participantId } : w))
    );
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Hapus data juara lama untuk kompetisi ini
      const { error: delError } = await supabase
        .from('competition_results')
        .delete()
        .eq('competition_id', competitionId);
      
      if (delError) throw delError;

      // Filter pemenang yang valid
      const validWinners = winners
        .filter(w => w.participant_id)
        .map(w => ({
          competition_id: competitionId,
          participant_id: w.participant_id,
          notes: w.rank.toString()
        }));

      if (validWinners.length > 0) {
        // Insert juara baru
        const { error: insertError } = await supabase
          .from('competition_results')
          .insert(validWinners);
        
        if (insertError) throw insertError;
      }

      // Update status lomba menjadi Finished jika ada juara, kembali ke Ongoing jika tidak ada
      if (validWinners.length > 0) {
        await supabase
          .from('competitions')
          .update({ status: 'Finished' })
          .eq('id', competitionId);
      } else {
        await supabase
          .from('competitions')
          .update({ status: 'Registration' })
          .eq('id', competitionId);
      }

      queryClient.invalidateQueries({ queryKey: ['competitions-results'] });
      queryClient.invalidateQueries({ queryKey: ['competitions'] });
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat menyimpan hasil');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isParticipantsLoading) {
    return <div className="p-4 text-center text-slate-500">Memuat peserta...</div>;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {error && <div className="text-red-500 text-sm font-medium p-3 bg-red-50 rounded-md">{error}</div>}
      
      {!participants || participants.length === 0 ? (
        <div className="text-center p-6 bg-slate-50 rounded-xl text-slate-500">
          Belum ada peserta yang mendaftar pada lomba ini.
        </div>
      ) : (
        <div className="space-y-4">
          {winners.map((winner) => (
            <div key={winner.rank} className="flex flex-col gap-2 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <Label className="flex items-center gap-2 font-bold text-slate-700">
                {winner.rank === 1 && <span className="text-2xl">🥇</span>}
                {winner.rank === 2 && <span className="text-2xl">🥈</span>}
                {winner.rank === 3 && <span className="text-2xl">🥉</span>}
                Juara {winner.rank}
              </Label>
              <select
                className="flex h-12 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base shadow-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                value={winner.participant_id}
                onChange={(e) => handleSelectWinner(winner.rank, e.target.value)}
              >
                <option value="">Pilih Juara {winner.rank}...</option>
                {participants.map((p: any) => {
                  const isSelectedElsewhere = winners.some(w => w.rank !== winner.rank && w.participant_id === p.participant_id && p.participant_id !== '');
                  return (
                    <option key={p.id} value={p.participant_id} disabled={isSelectedElsewhere}>
                      {p.participants?.full_name}
                    </option>
                  );
                })}
              </select>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className="h-12 rounded-xl px-6"
        >
          Batal
        </Button>
        <Button 
          type="submit" 
          disabled={isSubmitting || !participants || participants.length === 0} 
          className="h-12 rounded-xl px-6 bg-amber-500 hover:bg-amber-600 text-white border-none shadow-md"
        >
          {isSubmitting ? 'Menyimpan...' : 'Simpan Hasil'}
        </Button>
      </div>
    </form>
  );
}
