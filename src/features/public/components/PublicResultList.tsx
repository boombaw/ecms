'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toTitleCase } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Award, Medal, Crown, MapPin, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

type ResultPublic = {
  id: string; // competition_id
  competition_title: string;
  category_id: string;
  rank: string;
  participant_name: string;
  participant_address: string;
};

export function PublicResultList() {
  const [results, setResults] = useState<ResultPublic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const { data, error } = await supabase
          .from('competition_results')
          .select(`
            competition_id,
            notes,
            competitions(title, category_id),
            participants(full_name, address)
          `)
          .order('competition_id', { ascending: false })
          .order('notes', { ascending: true }); // notes contains rank '1', '2', '3'

        if (error) throw error;

        // Transform data
        const transformedData: ResultPublic[] = (data as any[]).map((r) => ({
          id: r.competition_id + r.notes,
          competition_title: r.competitions?.title ? toTitleCase(r.competitions.title) : 'Lomba',
          category_id: r.competitions?.category_id || '',
          rank: r.notes || '1',
          participant_name: r.participants?.full_name ? toTitleCase(r.participants.full_name) : 'Tidak Diketahui',
          participant_address: r.participants?.address ? toTitleCase(r.participants.address) : 'Tidak ada alamat',
        }));

        setResults(transformedData);
      } catch (err) {
        console.error('Error fetching results:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();

    // Listen to real-time changes on public schema
    const channel = supabase
      .channel('public-results-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        () => {
          fetchResults();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (isLoading) {
    return <div className="text-center py-12 text-slate-500 animate-pulse">Memuat pengumuman juara...</div>;
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
        <Award className="h-12 w-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500 font-medium">Belum ada pengumuman juara.</p>
      </div>
    );
  }

  const filteredResults = results.filter((r) => 
    r.competition_title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.participant_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (r.participant_address && r.participant_address.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <>
      <div className="mb-6 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
        <Input 
          type="text" 
          placeholder="Cari lomba, nama, atau blok rumah juara..." 
          className="!pl-12 h-14 rounded-2xl border-outline-variant bg-white text-base shadow-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid gap-4">
        {filteredResults.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
            <p className="text-slate-500 font-medium">Pengumuman juara tidak ditemukan.</p>
          </div>
        ) : (
        filteredResults.map((result) => {
        let cardStyle = "border-l-8 border-l-slate-400";
        let rankText = "JUARA HARAPAN";
        let rankIcon = "🎖️";

        if (result.rank === '1') {
          cardStyle = "border-l-8 border-l-yellow-400";
          rankText = "JUARA 1";
          rankIcon = "🥇";
        } else if (result.rank === '2') {
          cardStyle = "border-l-8 border-l-gray-400";
          rankText = "JUARA 2";
          rankIcon = "🥈";
        } else if (result.rank === '3') {
          cardStyle = "border-l-8 border-l-orange-500";
          rankText = "JUARA 3";
          rankIcon = "🥉";
        }

        return (
          <Card key={result.id} className={`${cardStyle} shadow-md`}>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-500 mb-1 uppercase tracking-wide">
                    {result.competition_title} {result.category_id ? `(${result.category_id})` : ''}
                  </p>
                  <h3 className="text-2xl font-bold text-slate-800">{result.participant_name}</h3>
                  <p className="text-lg text-slate-600 mt-1">{result.participant_address}</p>
                </div>
                <div className="bg-slate-100 text-slate-800 px-4 py-2 rounded-xl text-center md:text-right">
                  <p className="text-sm font-medium uppercase tracking-wider">Meraih</p>
                  <p className="text-2xl font-extrabold">{rankText} {rankIcon}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      }))}
    </div>
    </>
  );
}
