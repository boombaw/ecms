# Event Competition Management System (ECMS)

## Competition Implementation Plan (MVP)

### Scope
- Ranking
- Cup (Knockout)
- Individual
- Team

## Database Changes
### competitions
- competition_format: ranking, cup

## Competition Matrix
| Type       | Team Registration Mode | Format  | Contoh             |
| ------------| ------------------------| ---------| --------------------|
| Individual | -                      | Ranking | Balap Karung       |
| Individual | -                      | Cup     | Catur              |
| Team       | Existing               | Ranking | Estafet            |
| Team       | Existing               | Cup     | Tarik Tambang      |
| Team       | Random                 | Ranking | Fun Games          |
| Team       | Random                 | Cup     | Tarik Tambang Acak |

## Public Flow
### Individual
Pilih lomba -> Daftar -> Isi Nama & Blok Rumah -> Selesai.

### Team Existing
Pilih lomba -> Daftar Tim -> Isi Nama Tim -> Tambah Anggota (Nama + Blok Rumah) -> Selesai.

### Team Random
Pilih lomba -> Daftar -> Isi Nama & Blok Rumah -> Selesai.

## Admin Flow
### Ranking
Registrasi -> Lomba -> Input Juara -> Publish.

### Cup
Registrasi -> Generate Bracket -> Quarter Final -> Semi Final -> Final -> Champion.

### Team Random
Registrasi peserta -> Kelola Team -> Acak Team -> Tentukan jumlah tim atau anggota -> Review -> Simpan.

Saat simpan:
- Create Teams
- Update registrations.team_id

## Bracket
Admin klik Generate Bracket.
Input pemenang tiap match, sistem otomatis mengisi ronde berikutnya.

## Tabel Baru: matches
- id
- competition_id
- round
- match_number
- participant1_id
- participant2_id
- team1_id
- team2_id
- winner_participant_id
- winner_team_id
- next_match_id
- status (pending, finished)

## Roadmap
1. Authentication, Event, Competition
2. Registration & Team
3. Ranking Module
4. Cup Module
