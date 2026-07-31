# Team Registration Flow

## Overview

Untuk mendukung berbagai jenis perlombaan, sistem membedakan dua konsep utama:

1. Jenis lomba (`competition_type`)
2. Metode pembentukan tim (`team_registration_mode`)

Dengan pendekatan ini, UI publik maupun dashboard admin dapat menyesuaikan alur tanpa membuat database menjadi kompleks.

---

# Database Changes

## competitions

### Sebelum

```sql
type
```

### Sesudah

```sql
competition_type
```

Enum

```text
individual
team
```

---

Tambahkan kolom baru

```sql
team_registration_mode
```

Enum

```text
existing
random
```

Keterangan

| Value | Deskripsi |
|--------|-----------|
| existing | Peserta mendaftarkan tim beserta anggota. |
| random | Peserta hanya mendaftarkan diri. Tim akan dibentuk oleh admin. |

> Nilai `team_registration_mode` hanya digunakan apabila `competition_type = team`.

---

# Competition Matrix

| Competition Type | Team Registration Mode | Public Registration |
|------------------|------------------------|---------------------|
| individual | - | Daftar Individu |
| team | existing | Daftar Tim |
| team | random | Daftar Individu |

---

# Public Registration Flow

## 1. Individual Competition

Contoh

- Balap Karung
- Makan Kerupuk
- Balap Kelereng

Flow

```
Pilih Lomba
        │
        ▼
Klik Daftar
        │
        ▼
Isi Data Peserta
        │
        ▼
Selesai
```

Form

```
Nama

Blok Rumah

Nomor HP (optional)
```

Database

```
participants
↓

registrations

team_id = NULL
```

---

# 2. Team Competition (Existing Team)

Contoh

- Tarik Tambang Antar RT
- Voli
- Futsal

Flow

```
Pilih Lomba
        │
        ▼
Klik Daftar
        │
        ▼
Isi Nama Tim
        │
        ▼
Isi Daftar Anggota
        │
        ▼
Selesai
```

Form

```
Nama Tim

====================

Nama          Blok Rumah

Andi          A-01

Budi          A-02

Candra        A-03

Dedi          A-04

[ + Tambah Anggota ]
```

Saat submit

```
Insert Team

↓

Insert Participants

↓

Insert Registrations
```

Contoh

```
Team Garuda

↓

Andi

↓

Registration
team_id = Garuda
```

---

# 3. Team Competition (Random Team)

Contoh

- Fun Games
- Estafet
- Ice Breaking

Flow

```
Pilih Lomba
        │
        ▼
Klik Daftar
        │
        ▼
Isi Data Peserta
        │
        ▼
Selesai
```

Form

```
Nama

Blok Rumah
```

Tidak ada

- Nama Tim
- Tambah Anggota

Karena tim akan dibentuk oleh panitia.

Database

```
participants

↓

registrations

team_id = NULL
```

---

# Admin Flow

## Existing Team

Menu

```
Kelola Tim
```

Admin dapat

- Melihat tim
- Edit nama tim
- Edit anggota (opsional)

Tidak ada tombol Acak Tim.

---

## Random Team

Menu

```
Kelola Tim

↓

Acak Tim
```

Dialog

```
Jumlah Anggota per Tim

[ 5 ]

```

Contoh

40 peserta

Jumlah anggota

5

↓

Generate

↓

Tim 1

Andi
Budi
Candra
Dedi
Eko

----------------

Tim 2

...
```

Admin dapat

- Acak Ulang
- Drag & Drop peserta antar tim (opsional)
- Simpan Tim

Saat klik **Simpan Tim**

```
Insert Teams

↓

Update registrations.team_id
```

---

# UI Behaviour

## Individual

Card

```
👤 Individu
```

Button

```
Daftar
```

---

## Team (Existing)

Card

```
👥 Kelompok

🏷 Tim Sendiri
```

Button

```
Daftar Tim
```

---

## Team (Random)

Card

```
👥 Kelompok

🎲 Tim Diacak Panitia
```

Button

```
Daftar Peserta
```

---

# Database Flow

## Individual

```
participants

↓

registrations
(team_id = NULL)
```

---

## Existing Team

```
teams

↓

participants

↓

registrations
(team_id = xx)
```

---

## Random Team

Saat registrasi

```
participants

↓

registrations
(team_id = NULL)
```

Setelah admin mengacak

```
Create Teams

↓

Update registrations.team_id
```

---

# Advantages

## Individual

- Registrasi sederhana
- Tidak memerlukan tim

---

## Existing Team

- Ketua tim dapat langsung mendaftarkan seluruh anggota
- Cocok untuk lomba antar RT atau tim yang sudah terbentuk

---

## Random Team

- Peserta hanya mendaftarkan diri
- Panitia bebas menentukan jumlah tim
- Dapat mengacak ulang sebelum disimpan
- Jumlah anggota tiap tim dapat dibuat dinamis

---

# Summary

Struktur database hanya membutuhkan dua perubahan pada tabel `competitions`.

```sql
competition_type
```

Enum

```text
individual
team
```

dan

```sql
team_registration_mode
```

Enum

```text
existing
random
```

Dengan dua kolom tersebut, seluruh alur registrasi dapat ditentukan tanpa menambah kompleksitas database, sementara UI publik dan dashboard admin dapat menyesuaikan secara otomatis berdasarkan konfigurasi lomba.