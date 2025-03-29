# Perjuangan Semut (Battle Blasters)

Sebuah permainan artileri berbasis giliran di mana pemain mengendalikan semut yang berjuang untuk bertahan hidup dan mengalahkan lawan mereka.

## Deskripsi

Perjuangan Semut adalah permainan artileri berbasis giliran yang terinspirasi oleh game klasik seperti Worms dan Gunbound. Pemain mengendalikan semut yang dilengkapi dengan berbagai senjata dan harus mengalahkan semut lawan dengan menembakkan proyektil, mempertimbangkan sudut, kekuatan, dan pengaruh angin.

## Fitur Utama

- **Pertarungan Berbasis Giliran**: Pemain bergantian menembakkan senjata mereka
- **Fisika Realistis**: Proyektil dipengaruhi oleh gravitasi dan angin
- **Terrain yang Dapat Dihancurkan**: Ledakan akan mengubah bentuk terrain
- **Berbagai Senjata**: 
  - Meriam (Cannon): Senjata dasar dengan keseimbangan damage dan radius
  - Peluncur Roket (Rocket Launcher): Menciptakan ledakan tambahan
  - Mortir (Mortar): Dapat menembus terrain
  - Peluncur Granat (Grenade Launcher): Dapat memantul sebelum meledak
- **Efek Suara**: Suara untuk tembakan, ledakan, dan hit
- **Kontrol Intuitif**: Gunakan keyboard atau mouse untuk mengatur sudut dan kekuatan tembakan

## Teknologi yang Digunakan

- React
- TypeScript
- Redux (Redux Toolkit)
- Styled Components
- HTML5 Canvas
- Matter.js (Fisika)

## Instalasi dan Menjalankan

1. Clone repositori ini

```
git clone https://github.com/username/perjuangan-semut.git
cd perjuangan-semut
```

2. Instal dependensi

```
npm install
```

3. Jalankan dalam mode development
```
npm run dev
```

4. Buka browser dan akses `http://localhost:5173` (atau port yang ditampilkan di terminal)

## Cara Bermain

### Kontrol

- **Panah Kiri/Kanan**: Mengatur sudut tembakan
- **Panah Atas/Bawah**: Mengatur kekuatan tembakan
- **A/D**: Bergerak ke kiri/kanan
- **Spasi**: Menembak
- **1-4**: Memilih senjata (1: Meriam, 2: Peluncur Roket, 3: Mortir, 4: Peluncur Granat)
- **H**: Menampilkan/menyembunyikan kontrol

### Aturan Permainan

1. Pemain bergantian menembakkan senjata mereka
2. Angin akan mempengaruhi lintasan proyektil
3. Setiap senjata memiliki damage, radius, dan efek khusus yang berbeda
4. Pemain yang pertama kali mengurangi health lawan menjadi 0 adalah pemenangnya

## Struktur Proyek

- `src/components/`: Komponen React (Game, Player, Terrain, dll.)
- `src/store/`: State management dengan Redux
- `src/utils/`: Utilitas (AudioManager, weapons, dll.)
- `public/`: Aset statis (suara, gambar)

## Pengembangan Selanjutnya

Fitur yang direncanakan untuk pengembangan masa depan:

- Mode multipemain online
- Kustomisasi karakter
- Level dan terrain yang lebih bervariasi
- Power-up dan kemampuan khusus
- Mode permainan tambahan