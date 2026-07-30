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
import { Edit2, Trash2, Phone, Search, Home, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ParticipantDialog } from './ParticipantDialog';

type RegistrationRow = {
  id: string; // registration_id
  competition_id: string;
  participant_id: string;
  competitions: { title: string; category_id?: string; events: { name: string } | null } | null;
  participants: { id: string; full_name: string; phone: string | null; address: string | null; note: string | null } | null;
};

export function ParticipantTable() {
  const queryClient = useQueryClient();
  const [editingParticipant, setEditingParticipant] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const { data: registrations, isLoading, error } = useQuery({
    queryKey: ['registrations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('registrations')
        .select('*, competitions(title, category_id, events(name)), participants(id, full_name, phone, address, note)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return (data as RegistrationRow[]).map(row => ({
        ...row,
        competitions: row.competitions ? {
          ...row.competitions,
          title: toTitleCase(row.competitions.title),
          events: row.competitions.events ? {
            ...row.competitions.events,
            name: toTitleCase(row.competitions.events.name)
          } : null
        } : null,
        participants: row.participants ? {
          ...row.participants,
          full_name: toTitleCase(row.participants.full_name),
          address: row.participants.address ? toTitleCase(row.participants.address) : null
        } : null
      }));
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

  const handleDelete = async (regId: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus peserta "${name}" dari lomba ini?`)) {
      const { error } = await supabase.from('registrations').delete().eq('id', regId);
      if (error) {
        alert('Gagal menghapus peserta: ' + error.message);
      } else {
        queryClient.invalidateQueries({ queryKey: ['registrations'] });
      }
    }
  };

  const handleEdit = (reg: RegistrationRow) => {
    setEditingParticipant({
      registration_id: reg.id,
      id: reg.participants?.id,
      competition_id: reg.competition_id,
      full_name: reg.participants?.full_name || '',
      phone: reg.participants?.phone || '',
      address: reg.participants?.address || '',
      note: reg.participants?.note || '',
    });
    setIsEditDialogOpen(true);
  };

  const filteredRegistrations = registrations?.filter((reg) => {
    const matchesSearch = reg.participants?.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          reg.participants?.address?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategories.length === 0 || (reg.competitions?.category_id && selectedCategories.includes(reg.competitions.category_id));
    return matchesSearch && matchesCategory;
  }) || [];

  if (isLoading) {
    return <div className="p-8 text-center text-lg text-muted-foreground">Memuat data peserta...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-lg text-destructive">Gagal memuat data peserta.</div>;
  }

  return (
    <>
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex justify-between items-center hidden md:flex">
          <h2 className="text-2xl font-bold text-on-surface">Daftar Peserta</h2>
          <ParticipantDialog />
        </div>
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            type="text" 
            placeholder="Cari nama peserta atau alamat..." 
            className="pl-10 h-12 rounded-xl border-outline-variant bg-surface"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {(() => {
          const categories = Array.from(new Set(registrations?.map(r => r.competitions?.category_id).filter(Boolean))) as string[];
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

      {!registrations || registrations.length === 0 ? (
        <div className="p-8 text-center text-lg text-muted-foreground border rounded-xl bg-card">
          Belum ada data peserta.
        </div>
      ) : (
        <>
          {/* Mobile View: Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRegistrations.map((reg) => (
              <div key={reg.id} className="relative overflow-hidden rounded-xl shadow-lg group bg-[#E3242B] aspect-[1.6/1]">
                {/* Background Pattern */}
                <div 
                  className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-50"
                  style={{ backgroundImage: "url('/assets/card_background.png')" }}
                ></div>
                
                <div className="relative flex flex-col h-full p-6"> 
                                    {/* Participant Info */}
                  <div className="mb-4">
                    <h3 className="font-bold text-3xl text-white mb-1 leading-tight line-clamp-2 drop-shadow-md">
                      {reg.participants?.full_name}
                    </h3>
                    <p className="text-lg text-white/90 font-medium drop-shadow-sm flex items-center gap-2">
                      {reg.competitions?.title || '-'}
                      {reg.competitions?.category_id && (
                        <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full border border-white/40">
                          {reg.competitions.category_id}
                        </span>
                      )}
                    </p>
                  </div>
                  
                    <div className="flex flex-col gap-2 mb-6">
                      <div className="flex items-center gap-3 text-white">
                        <Home className="h-5 w-5 shrink-0" />
                        <span className="text-base truncate drop-shadow-sm">{reg.participants?.address || '-'}</span>
                      </div>
                      <div className="flex items-center gap-3 text-white">
                        <Phone className="h-5 w-5 shrink-0" />
                        <span className="text-base truncate drop-shadow-sm">{reg.participants?.phone || '-'}</span>
                      </div>
                      {reg.participants?.note && (
                        <div className="flex items-center gap-3 text-white">
                          <FileText className="h-5 w-5 shrink-0" />
                          <span className="text-base truncate drop-shadow-sm italic">{reg.participants?.note}</span>
                        </div>
                      )}
                    </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <Button 
                      onClick={() => handleEdit(reg)}
                      variant="ghost" 
                      className="h-10 px-6 rounded-full text-base font-semibold bg-white/20 hover:bg-white/30 text-white transition-colors border-none backdrop-blur-sm"
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button 
                      onClick={() => handleDelete(reg.id, reg.participants?.full_name || '')}
                      variant="ghost" 
                      className="h-10 px-6 rounded-full text-base font-semibold bg-white/20 hover:bg-white/30 text-white transition-colors border-none backdrop-blur-sm"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Hapus
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>


        </>
      )}

      {/* Edit Dialog */}
      <ParticipantDialog 
        open={isEditDialogOpen} 
        onOpenChange={setIsEditDialogOpen} 
        initialData={editingParticipant || undefined} 
      />
    </>
  );
}
