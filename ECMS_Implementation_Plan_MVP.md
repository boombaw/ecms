## Event Competition Management System (ECMS)

## Implementation Plan (MVP v1.0)

### Tech Stack

*   Next.js 15 (App Router)
*   TypeScript
*   Tailwind CSS v4
*   animate-ui (recommended) + shadcn/ui
*   React Hook Form + Zod
*   TanStack Query
*   TanStack Table
*   Supabase (PostgreSQL, Auth, Realtime, Storage)
*   Deploy: Vercel (recommended) / Netlify

## Goal

Membangun aplikasi **mobile-first** untuk mengelola perlombaan  
seperti: - 17 Agustus - Class Meeting - Festival Desa - Turnamen  
olahraga

## Design Principles

*   Mobile First
*   Realtime
*   Simple workflow
*   CRUD-first
*   Offline-friendly (future PWA)

## Folder Structure

```plaintext
src/
├── app
├── components/
├── features/
├── hooks/
├── lib/
├── services/
├── types/
├── utils/
└── constants/
```

## Modules

## Authenticationd

*   Login
*   Role: Super Admin, Admin, Operator, Viewer

## Dashboard

*   Total Event
*   Total Lomba
*   Total Peserta
*   Statistik

## Event

*   CRUD Event
*   Banner
*   Logo
*   Lokasi
*   Tanggal

## Competition

*   CRUD Lomba
*   Individu / Kelompok
*   Jadwal
*   Kuota
*   Catatan

## Participant

*   CRUD Peserta
*   Import Excel
*   Manual Input

## Team

*   CRUD Team
*   Anggota

## Registration

*   Daftarkan peserta ke lomba (bisa dari admin atau peserta sendiri)

## Schedule

*   Timeline lomba

## Result (menggantikan "Input Juara")

Alur sederhana:

1.  Lomba berlangsung.
2.  Panitia selesai menentukan pemenang.
3.  Admin membuka halaman **Hasil Lomba**.
4.  Input penghargaan.
5.  Simpan.
6.  Status otomatis menjadi **Selesai**.

Tidak diperlukan tombol **Start** maupun **Finish**.

Contoh hasil:

*   🥇 Juara 1 : Andi
*   🥈 Juara 2 : Budi
*   🥉 Juara 3 : Candra

Atau:

*   🥇 Juara 1 : Tim Merah

Penghargaan bersifat dinamis: - Juara 1 - Juara 2 - Juara 3 - Harapan -  
Favorit - Best Costume - dll.

## Database

## events

*   id
*   name
*   slug
*   description
*   start\_date
*   end\_date
*   location
*   banner
*   logo
*   status

## competitions

*   id
*   event\_id
*   category\_id
*   title
*   type
*   schedule
*   location
*   max\_participants
*   status
*   notes

## participants

*   id
*   full\_name
*   gender
*   birth\_date
*   phone
*   address
*   rt
*   rw

## teams

*   id
*   competition\_id
*   name
*   captain

## registrations

*   id
*   competition\_id
*   participant\_id
*   team\_id

## award\_levels

Master penghargaan: - Juara 1 - Juara 2 - Juara 3 - Harapan - Favorit -  
Best Costume

## competition\_results

*   id
*   competition\_id
*   award\_level\_id
*   participant\_id
*   team\_id
*   notes

Jika terdapat minimal satu data hasil lomba, maka status kompetisi  
otomatis menjadi **Finished**.

## Public Page

*   Jadwal
*   Daftar Lomba
*   Hasil Lomba
*   Pengumuman

## Export

*   Excel
*   CSV
*   PDF

## Development Roadmap

## Sprint 1

*   Setup Next.js
*   Setup Supabase
*   Authentication
*   Dashboard
*   CRUD Event
*   CRUD Competition

## Sprint 2

*   Participant
*   Team
*   Registration
*   Realtime

## Sprint 3

*   Result
*   Export
*   Public Page

## Sprint 4

*   Statistik
*   PWA
*   Gallery
*   Announcement

## Future Features 

*   WhatsApp Notification
*   Bracket Tournament
*   Multi Judge Scoring
*   Leaderboard
*   Certificate Generator
*   Multi Tenant  
     

#### Publishable Key Supabase

sb\_publishable\_Spgfq4KTInvB7U26WCyDbw\_XNY11YxS

**Secret Key Supabase**  
sb\_secret\_cUVCdqWqjkEIwXiVkuobBA\_GvnXnPXh