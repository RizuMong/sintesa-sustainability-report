# Functional Specification Document - Sustainability Report System

## **1. Introduction**

### **1.1 Purpose & Scope of Document**

Dokumen Functional Specification Document (FSD) ini disusun untuk menjabarkan secara rinci dan komprehensif seluruh kebutuhan fungsional dari sistem Sustainability Report System (SRS) yang akan dikembangkan untuk Sintesa Group. Dokumen ini berfungsi sebagai jembatan komunikasi formal antara pihak Business User (Holding dan Subsidiaries), Project Sponsor, serta tim pengembang, sehingga seluruh pihak memiliki pemahaman yang seragam (single source of truth) mengenai cakupan pekerjaan, perilaku sistem, dan batasan teknis yang berlaku.

Ruang lingkup dokumen mencakup keseluruhan proses end-to-end pelaporan ESG dan SDG, mulai dari konfigurasi sistem oleh Platform Administrator, penyusunan kerangka pelaporan oleh Holding, hingga proses input data, evaluasi, konsolidasi, dan ekspor oleh seluruh aktor yang terlibat.

### **1.2 About Client**

Sintesa Group adalah perusahaan induk (Holding) yang menaungi sejumlah Anak Perusahaan (Subsidiaries) dan unit bisnis yang bergerak di berbagai sektor usaha. Sebagai entitas dengan komitmen terhadap praktik keberlanjutan dan tata kelola perusahaan yang baik, Sintesa Group memandang perlu adanya satu platform terpusat yang dapat mengintegrasikan proses pelaporan ESG dan SDG dari seluruh unit bisnis di bawah naungannya, guna mendukung kebutuhan pelaporan tahunan, kepatuhan terhadap standar GRI, dan pengambilan keputusan strategis eksekutif.

Data pelaporan GRI yang terkumpul melalui sistem ini akan menjadi base data bagi LCI (Life Cycle Indonesia), vendor mitra eksternal Sintesa Group, dalam menyusun sustainability report publikasi tahunan.

### **1.3 Definitions, Acronyms & Abbreviations**

| Istilah                              | Definisi                                                                                                                                                                                                                                                                                       |
| :----------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SRS                                  | Sustainability Report System — sistem pelaporan keberlanjutan terintegrasi yang menjadi subjek dokumen ini.                                                                                                                                                                                    |
| ESG                                  | Environmental, Social, and Governance — kerangka penilaian kinerja perusahaan dalam aspek lingkungan, sosial, dan tata kelola.                                                                                                                                                                 |
| GRI                                  | Global Reporting Initiative — standar internasional untuk pelaporan keberlanjutan.                                                                                                                                                                                                             |
| GRI\_QUANT                           | Tipe indikator GRI yang bersifat kuantitatif (nilai numerik, persentase, atau boolean).                                                                                                                                                                                                        |
| GRI\_QUAL                            | Tipe indikator GRI yang bersifat kualitatif (narasi berbasis nested Q\&A).                                                                                                                                                                                                                     |
| SDG\_ACTION                          | Tipe indikator yang digunakan khusus untuk Action Indicator pada SDG Action Plan Matrix.                                                                                                                                                                                                       |
| SDG                                  | Sustainable Development Goals — 17 tujuan pembangunan berkelanjutan PBB. Sintesa Group mengadopsi sebagian dari 17 tujuan tersebut.                                                                                                                                                            |
| MKI                                  | Master Key Indicator — komponen dynamic form builder inti sistem yang menentukan struktur formulir pelaporan.                                                                                                                                                                                  |
| RBAC                                 | Role-Based Access Control — mekanisme pengendalian hak akses berdasarkan peran pengguna.                                                                                                                                                                                                       |
| PIC SR Holding                       | Person In Charge Sustainability Report di sisi Holding; aktor yang mengelola Framework GRI dan SDGl.                                                                                                                                                                                           |
| Sustainability Subsidiary PIC        | Person In Charge Keberlanjutan di sisi Anak Perusahaan; aktor yang melakukan input data pelaporan.                                                                                                                                                                                             |
| Platform Administrator               | Aktor yang mengelola seluruh konfigurasi sistem (master data, workflow, notifikasi) melalui modul back-office.                                                                                                                                                                                 |
| LCI                                  | Life Cycle Indonesia — vendor mitra eksternal yang mengonsumsi base data GRI untuk menyusun sustainability report publikasi tahunan Sintesa Group.                                                                                                                                             |
| Take                                 | Tindakan Subsidiary berkomitmen menjalankan rencana aksi dari Action Plan Matrix Holding.                                                                                                                                                                                                      |
| Skip                                 | Tindakan Subsidiary melewati rencana aksi, disertai wajib isi Justification Text Area berisi alasan ketidakrelevanan.                                                                                                                                                                          |
| Initiate New Plan                    | Rencana aksi mandiri yang dibuat oleh Subsidiary di luar Action Plan Matrix Holding, melalui menu Initiate New Plan pada Sustainability Subsidiary Portal. Governance aktivasinya mengikuti status adopsi SDG rujukan (lihat SDG Adopted / SDG Non-Adopted).                                   |
| created\_by\_level                   | Kolom database ENUM ('Holding', 'Subsidiary') untuk mengidentifikasi asal usul pembuatan rencana aksi.                                                                                                                                                                                         |
| Unverified / Non-Official SDG        | Flag permanen pada Initiate New Plan yang dibuat dari SDG Non-Adopted. Item dengan flag ini wajib melalui approval Holding sebelum aktif, dan tetap tampil dengan penanda visual berbeda di tracker/dashboard meskipun sudah Approved, untuk membedakannya dari Action Plan resmi SDG Adopted. |
| Approval Line                        | Rantai persetujuan bertingkat yang dikonfigurasi per entitas dan per tipe submission.                                                                                                                                                                                                          |
| Rejected                             | Status submission ketika ditolak oleh approver Holding; wajib disertai Reviewer Notes.                                                                                                                                                                                                         |
| Cron Job                             | Background service terjadwal yang mengeksekusi notifikasi otomatis sesuai konfigurasi Periodic Notification.                                                                                                                                                                                   |
| FSD                                  | Functional Specification Document — dokumen ini.                                                                                                                                                                                                                                               |
| approval\_type                       | Atribut pada setiap level Approval Line di Workflow Configuration. Bernilai 'Holding Approval' (approver berasal dari PIC SR Holding) atau 'By PIC' (approver mengikuti PIC entitas Parent pengirim, mis. PIC Subsidiary sebagai approver Branch-nya).                                         |
| Entity-Scoped Approval               | Mekanisme routing approval yang menyesuaikan approver berdasarkan posisi hierarki entitas pengirim; memungkinkan Subsidiary menjadi approver Level 1 bagi submission Branch di bawahnya, sebelum (opsional) diteruskan ke Holding.                                                             |
| Branch                               | Level terbawah pada hierarki Master Entity (Holding \-\> Subsidiary \-\> Branch). Branch dapat menjadi submitter data; hasil submission-nya direview oleh PIC Subsidiary induknya, bukan langsung oleh Holding.                                                                                |
| Action Plan Change Request           | Pengajuan perubahan atas Action Plan (baik dari SDG Framework Holding maupun Initiate New Plan) yang sudah disubmit/Taken. Wajib melalui approval Holding dan tercatat pada audit trail (request date/by, approved date/by, notes/reason).                                                     |
| Realization Window                   | Jendela waktu yang menentukan apakah pengisian Report Plan Realization untuk suatu Master Period diizinkan. Dikonfigurasi oleh Administrator pada Master Period, terpisah dari status Active/Inactive Period itu sendiri.                                                                      |
| Impact Type (Operation / Investment) | Klasifikasi dampak pada baris Action Plan Matrix di SDG Framework. Operation Impact dapat diisi seluruh entitas bisnis; Investment Impact hanya dapat diisi oleh entitas dengan dampak investasi (SDS, SBG, MEPPO).                                                                            |
| Branch Data Approval                 | Menu pada Sustainability Subsidiary Portal yang disiapkan untuk PIC Subsidiary mengevaluasi submission GRI, SDG, dan Initiate New Plan dari Branch di bawahnya. Dirancang scalable; belum aktif digunakan pada fase awal implementasi karena submission oleh Branch belum berjalan.            |

### **1.4 References**

- Knowledge Base Document (KBD) — Sustainability Report System.

- Kerangka standar pelaporan Global Reporting Initiative (GRI Standards).

- Kerangka 17 Sustainable Development Goals (SDGs) PBB.

- Hasil diskusi dan workshop requirement gathering antara Tim Project dengan Sintesa Group.

## **2. Project Background**

### **2.1 Background**

Saat ini, proses pelaporan GRI dan SDG di lingkungan Sintesa Group berjalan secara terdesentralisasi tanpa satu sistem yang terintegrasi. Kondisi ini menimbulkan tantangan: tidak adanya keseragaman format pelaporan antar entitas, sulitnya Holding memantau kepatuhan pengumpulan laporan secara _real-time_, proses evaluasi manual yang rentan keterlambatan dan inkonsistensi data, serta ketidaktersediaan dasbor konsolidasi untuk mendukung keputusan strategis eksekutif.

Sintesa Group berinisiatif membangun Sustainability Report System (SRS) — platform berbasis web terpusat yang menjembatani aliran data dari level anak perusahaan hingga Holding secara _real-time_, transparan, dan akuntabel. Data GRI yang dikumpulkan sistem ini akan menjadi _base_ data LCI dalam menyusun laporan keberlanjutan publik tahunan.

Dalam konteks SDG, Sintesa Group mengadopsi 9 dari 17 SDG global PBB sesuai fokus materialitas tahun berjalan. PIC SR Holding mengelola status adopsi ini dan menyusun SDG Roadmap sebagai kerangka resmi. Subsidiary diberikan fleksibilitas membuat Local Initiative Plan mandiri — dengan governance berbeda berdasarkan status adopsi SDG yang dipilih.

### **2.2 Goals & Objectives**

- Menyediakan _single source of truth_ bagi seluruh proses pelaporan Global Reporting Initiative (GRI) dan Sustainable Development Goals (SDG) di Sintesa Group.

- Mengotomasi distribusi _template_ pelaporan GRI dan Action Plan Matrix dari Holding ke seluruh Subsidiary.

- Menstandarkan proses input, evaluasi, dan approval data dengan alur kerja terstruktur dan terlacak (auditable).

- Menyediakan dasbor konsolidasi _real-time_ bagi eksekutif Holding (Performance Tracking & Strategic Insight).

- Menghasilkan data konsolidasi siap ekspor (.csv) sebagai base data LCI untuk sustainability report publikasi tahunan.

### **2.3 Scope**

Dua modul utama:

1. **Platform Administrator (Back-Office & Configuration)** Pusat kendali sistem yang berfungsi untuk mengelola _master data_, menyusun formulir dinamis melalui _MKI form builder_, serta mengatur _workflow_ dan sistem notifikasi otomatis.
2. **Sustainability Reporting Portal (Unified Consolidation & Operations)** Modul konsolidasi yang mengintegrasikan peran Holding dan Anak Perusahaan dalam satu pintu:

- **Sisi Holding (Corporate Strategy):** Mengelola kerangka kerja GRI dan target SDG, melakukan _review & approval_, serta memantau performa grup melalui _dashboard_ analitik dan fitur ekspor laporan.
- **Sisi Subsidiaries (Operational Reporting):** Memfasilitasi anak perusahaan dalam melakukan _GRI submission_, menginisiasi rencana baru (_Initiate New Plan_), mengajukan rencana aksi (_Submit Action Plan: Take/Skip_), serta melaporkan realisasinya.

### **2.4 Out of Scope**

- Penyusunan dan penerbitan dokumen laporan keberlanjutan final (final publication layout) — sistem hanya menyediakan data konsolidasi dan fasilitas ekspor.

- Integrasi langsung dengan sistem HRIS eksisting maupun sistem eksternal masing-masing entitas.

- Verifikasi independen pihak ketiga (third-party assurance/audit) atas data ESG.

- Akses publik (public-facing portal) bagi pihak eksternal.

- Submission data (GRI & SDG) oleh entitas level Branch pada fase awal implementasi — kondisi aktual saat ini pelaporan dilakukan langsung di level Subsidiary (Parent Company), bukan Branch. Arsitektur RBAC dan Workflow tetap dirancang _scalable_ untuk mendukung Branch di kemudian hari (lihat 2.6 dan 3.6).

### **2.5 Assumptions**

| Asumsi                                                                                                                        | Status    |
| :---------------------------------------------------------------------------------------------------------------------------- | :-------- |
| Seluruh entitas telah menunjuk PIC yang bertanggung jawab atas input data.                                                    | Confirmed |
| Data master awal (Entity, Employee, Position, Period, Pillar) akan disediakan Sintesa Group pada tahap inisiasi implementasi. | Confirmed |
| Pengguna memiliki koneksi internet stabil dan browser modern.                                                                 | Confirmed |
| Notifikasi disampaikan via Email tanpa integrasi kanal pihak ketiga lain kecuali dinyatakan berbeda.                          | Confirmed |

## **3. System Overview**

### **3.1 Role-Based Access Control (RBAC) Matrix**

Hak akses seluruh aktor sistem diatur berdasarkan matriks berikut. Pembatasan diterapkan pada tingkat App (Modul) dan Page (Menu).

| Modul / Fitur                       | Platform Administrator | PIC SR Holding                    | Sustainability Subsidiary PIC                                                            |
| :---------------------------------- | :--------------------- | :-------------------------------- | :--------------------------------------------------------------------------------------- |
| Master Data Management              | CRUD (Full)            | Read Only                         | No Access                                                                                |
| Master Key Indicator (Form Builder) | CRUD (Full)            | Read Only                         | Create Only (Scoped: SDG Action Indicator, self-initiative only)                         |
| Workflow & Notification Config      | CRUD (Full)            | Read Only                         | No Access                                                                                |
| GRI & SDG Framework Creator         | Read Only              | CRUD (Full)                       | No Access                                                                                |
| Review & Approval Line              | No Access              | Execute (Approve/Reject)          | Execute (Approve/Reject) — Scoped: Branch submissions only, jika entitas memiliki Branch |
| Dashboard & Strategic Insight       | Read Only              | Read Only (Global & Consolidated) | No Access                                                                                |
| Data Submission (GRI & SDG)         | No Access              | No Access                         | CRUD (Subsidiary Scope)                                                                  |
| Initiate New Plan                   | No Access              | No Access                         | CRUD (Local Scope Only)                                                                  |

**Catatan — Entity-Scoped Approval:**  
Matriks di atas merepresentasikan batasan RBAC pada tingkat App/Page. Namun untuk baris "Review & Approval Line" dan "Master Key Indicator (Form Builder)", cakupan (scope) data yang dapat diakses Sustainability Subsidiary PIC dipersempit lebih lanjut secara query-level berdasarkan hierarki Master Entity (self-referencing parent\_entity\_id): seorang PIC Subsidiary hanya dapat mengevaluasi submission dari Branch yang menjadi anak entitasnya sendiri, dan hanya dapat membuat SDG Action Indicator baru untuk dipakai pada Initiate New Plan miliknya sendiri. Detail lengkap mekanisme ini dijabarkan pada bagian 2.4 Entity-Scoped Approval Routing dan 1.6 MKI \- SDG: Indikator Buatan Subsidiary.

### **3.2 Menu Structure & Navigation Hierarchy**

Struktur navigasi Module → Menu → Sub-Menu berikut adalah struktur final yang menjadi acuan implementasi pada platform Officeless. Penamaan pada kolom Menu/Sub-Menu di bawah ini adalah penamaan resmi yang tampil pada navigasi aplikasi.

| Module                           | Menu                             | Sub-Menu                               |
| :------------------------------- | :------------------------------- | :------------------------------------- |
| **1\. Platform Administrator**   | Master Data                      | Master Unit                            |
|                                  |                                  | Master Entity                          |
|                                  |                                  | Master Pillar                          |
|                                  |                                  | Master Period                          |
|                                  |                                  | Global Reporting Initiative (GRI)      |
|                                  | User Management                  | Position                               |
|                                  |                                  | Employee                               |
|                                  |                                  | Access Management                      |
|                                  | Master Key Indicator             | GRI \- Qualitative                     |
|                                  |                                  | GRI \- Quantitative                    |
|                                  |                                  | SDG                                    |
|                                  | Periodic Notification            | —                                      |
|                                  | Workflow Configuration           | —                                      |
|                                  | Generate Action Plan             | —                                      |
| **2\. Sustainability Reporting** | Global Reporting Initiative      | Qualitative                            |
|                                  |                                  | Quantitative                           |
|                                  | Sustainability Development Goals | SDG Adoption Management                |
|                                  |                                  | SDG Framework                          |
|                                  | Evaluate GRI \- Qualitative      | Approval                               |
|                                  | Evaluate GRI \- Quantitative     | Approval                               |
|                                  | Report Plan Realization          | Approval                               |
|                                  | Initiated Action Plan            | Approval                               |
|                                  | Action Plan Change Request       | Approval                               |
|                                  | Performance Tracking             | GRI \- Qualitative Submission Tracker  |
|                                  |                                  | GRI \- Quantitative Submission Tracker |
|                                  |                                  | Action Plan Tracker                    |
|                                  |                                  | Initiate New Plan Tracker              |
|                                  |                                  | Realization Tracker                    |
|                                  | Strategic Insights               | —                                      |
|                                  | Data Export & Report             | GRI \- Qualitative Consolidation       |
|                                  |                                  | GRI \- Quantitative Consolidation      |
|                                  |                                  | SDG Consolidation                      |
|                                  | GRI \- Qualitative               | Submission                             |
|                                  | GRI \- Quantitative              | Submission                             |
|                                  | Submit Action Plan               | —                                      |
|                                  | Initiate New Plan                | Submission                             |
|                                  | Action Plan Change Request       | Submission                             |
|                                  | Report Plan Realization          | Submission                             |

_Catatan: "Submit Action Plan" merender mekanisme Take/Skip terhadap SDG Framework yang dipublikasikan Holding (lihat 3.3), sedangkan "Initiate New Plan" merender pembuatan rencana aksi mandiri Subsidiary di luar SDG Framework Holding (lihat 3.4)._

### **3.3 Business Process Flow**

Secara garis besar, alur proses bisnis sistem berjalan sebagai berikut:

1. Platform Administrator mengonfigurasi data master (Entity, Employee, MKI, Workflow, Notification).

2. PIC SR Holding membuat dan mempublikasikan template pelaporan GRI (Quantitative & Qualitative) serta Action Plan Matrix SDG. Publikasi memicu distribusi otomatis ke seluruh Subsidiary.

3. Sistem mengirimkan notifikasi periodik kepada Sustainability Subsidiary PIC sesuai jadwal yang dikonfigurasi.

4. Sustainability Subsidiary PIC mengisi GRI Submission (Quantitative & Qualitative) dan merespons SDG Framework melalui Submit Action Plan (Take/Skip) atau membuat Initiate New Plan mandiri.

5. Submission masuk ke Approval Line sesuai Workflow Configuration entitas pengirim: approval\_type 'Holding Approval' diarahkan ke PIC SR Holding, atau 'By PIC' diarahkan ke PIC Subsidiary induk (untuk submission dari Branch). Approver mereview dan memberi keputusan Approve atau Reject (wajib isi Reviewer Notes jika Reject).

6. Data Approved terkonsolidasi ke Performance Tracking dan Strategic Insight Dashboard.

7. PIC SR Holding mengekspor data konsolidasi sebagai file .csv untuk dikirimkan ke LCI.

![Sequence Diagram of the Business Process][image2]

Untuk image lebih detail, bisa refer ke link berikut: [FSD\_SD.png](https://drive.google.com/file/d/1II7tkipNS7DNlftYMRyac-XzgmMR2IRv/view?usp=sharing)

### **3.4 Entity Relationship Diagram** {#3.4-entity-relationship-diagram}

Hubungan antardata pada sistem Sustainability Reporting disajikan sebagai berikut:

![temporary ERD][image3]

Untuk image lebih detail, bisa refer ke link berikut: [Sintesa\_ERD\_PREDEV.png](https://drive.google.com/file/d/1E-uu1n1_3QPGMVKGf4sw5EVhDM4fi6tO/view?usp=sharing)

## **4. Functional Specification**

### **4.1 User Stories**

Kebutuhan fungsional dijabarkan dari perspektif tiga aktor utama sistem.

#### **A. Platform Administrator**

| ID        | User Story                                                                                                                                                                                                                                                                        |
| :-------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| US-ADM-01 | Sebagai Platform Administrator, saya ingin mengelola data Master Unit, sehingga satuan pengukuran tersedia sebagai referensi konsisten untuk seluruh indikator kuantitatif.                                                                                                       |
| US-ADM-02 | Sebagai Platform Administrator, saya ingin mengelola Master Entity dengan struktur hierarki self-referencing tak terbatas (Holding → Sub-holding → Subsidiary → Business Unit → Branch), sehingga seluruh struktur korporasi Sintesa Group dapat direpresentasikan secara akurat. |
| US-ADM-03 | Sebagai Platform Administrator, saya ingin mengelola Master Employee beserta konfigurasi role dan entitas yang ditugaskan, sehingga hak akses setiap pengguna sesuai tanggung jawabnya.                                                                                           |
| US-ADM-04 | Sebagai Platform Administrator, saya ingin mengkonfigurasi Access Management berbasis matriks App dan Page, sehingga setiap peran hanya dapat mengakses modul yang relevan.                                                                                                       |
| US-ADM-05 | Sebagai Platform Administrator, saya ingin mendefinisikan Master Key Indicator (MKI) secara dinamis menggunakan form builder, sehingga struktur formulir pelaporan dapat dikonfigurasi tanpa perubahan kode.                                                                      |
| US-ADM-06 | Sebagai Platform Administrator, saya ingin mengkonfigurasi Workflow Configuration (Approval Line) per entitas dan per tipe submission, sehingga alur persetujuan mengikuti struktur organisasi.                                                                                   |
| US-ADM-07 | Sebagai Platform Administrator, saya ingin mengonfigurasi Periodic Notification dengan jadwal otomatis (Cron Job), sehingga Sustainability Subsidiary PIC menerima pengingat tepat waktu.                                                                                         |
| US-ADM-08 | Sebagai Platform Administrator, saya ingin mengkonfigurasi approval\_type ('Holding Approval' atau 'By PIC') pada tiap level Approval Line di Workflow Configuration, sehingga submission dari Branch dapat dialihkan ke PIC Subsidiary induknya, bukan selalu ke Holding.        |

#### **B. PIC SR Holding**

| ID        | User Story                                                                                                                                                                                                                                    |
| :-------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| US-HLD-01 | Sebagai PIC SR Holding, saya ingin membuat rilis pelaporan GRI per tahun buku dan memetakan indikator dari MKI bertipe GRI\_QUANT dan GRI\_QUAL, sehingga template pelaporan terpusat terdistribusi otomatis ke seluruh Subsidiary.           |
| US-HLD-02 | Sebagai PIC SR Holding, saya ingin mengelola SDG Adoption Management untuk menyalakan/mematikan flag Adopted pada masing-masing dari 17 SDG PBB, sehingga SDG Roadmap Sintesa Group sesuai fokus materialitas tahun berjalan.                 |
| US-HLD-03 | Sebagai PIC SR Holding, saya ingin membuat SDG Framework (Parent SDG \+ Action Plan Matrix) dan mempublikasikannya, sehingga Action Plan terdistribusi otomatis sebagai daftar tugas wajib bagi setiap Subsidiary.                            |
| US-HLD-04 | Sebagai PIC SR Holding, saya ingin mereview submission GRI dan Action Plan Realization dari Subsidiary dengan keputusan Approve atau Reject (wajib isi Reviewer Notes jika Reject), sehingga kualitas data terjaga sebelum masuk konsolidasi. |
| US-HLD-05 | Sebagai PIC SR Holding, saya ingin memantau kelengkapan submission melalui Performance Tracking Dashboard, sehingga saya dapat mengidentifikasi Subsidiary yang terlambat dan mengirimkan pengingat manual.                                   |
| US-HLD-06 | Sebagai PIC SR Holding, saya ingin melihat Strategic Insight Dashboard berupa visualisasi data GRI Quantitative dan SDG performance, sehingga saya dapat menyajikan wawasan strategis kepada eksekutif.                                       |
| US-HLD-07 | Sebagai PIC SR Holding, saya ingin mengekspor data konsolidasi ke format .csv (GRI Disclosure dan SDG/Action Plan Realization), sehingga data siap diolah oleh LCI sebagai base data laporan publikasi tahunan.                               |

#### **C. Sustainability Subsidiary PIC**

| ID        | User Story                                                                                                                                                                                                                                                                                  |
| :-------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| US-SUB-01 | Sebagai Sustainability Subsidiary PIC, saya ingin mengisi GRI Submission Quantitative berdasarkan template aktif yang dirilis Holding, sehingga data kuantitatif entitas saya tercatat dengan format yang seragam.                                                                          |
| US-SUB-02 | Sebagai Sustainability Subsidiary PIC, saya ingin mengisi GRI Submission Qualitative melalui formulir nested Q\&A yang telah dikonfigurasi Holding, sehingga narasi keberlanjutan entitas saya terdokumentasi secara terstruktur.                                                           |
| US-SUB-03 | Sebagai Sustainability Subsidiary PIC, saya ingin merespons Action Plan Matrix dari Holding dengan tindakan Take atau Skip (disertai justification jika Skip), sehingga komitmen atau ketidakrelevanan aksi entitas saya tercatat.                                                          |
| US-SUB-04 | Sebagai Sustainability Subsidiary PIC, saya ingin membuat Initiate New Plan mandiri (dari SDG Adopted maupun Non-Adopted), sehingga program keberlanjutan lokal entitas saya dapat dicatat dan diakui sistem, mengikuti governance auto-Active (Adopted) atau wajib approval (Non-Adopted). |
| US-SUB-05 | Sebagai Sustainability Subsidiary PIC, saya ingin mengisi Report Plan Realization untuk setiap Action Plan yang berstatus Take, sehingga capaian kinerja entitas saya terpantau oleh Holding secara periodik.                                                                               |
| US-SUB-06 | Sebagai Sustainability Subsidiary PIC, saya ingin menerima notifikasi periodik otomatis dan mengetahui status submission saya (Draft/Submitted/Approved/Rejected), sehingga saya selalu tahu tindakan apa yang perlu dilakukan.                                                             |
| US-SUB-07 | Sebagai Sustainability Subsidiary PIC yang membawahi Branch, saya ingin mereview dan menyetujui/menolak submission GRI dan Realization dari Branch saya sendiri, sehingga data Branch tervalidasi sebelum diteruskan ke Holding.                                                            |
| US-SUB-08 | Sebagai Sustainability Subsidiary PIC, saya ingin membuat Action Indicator SDG baru yang terbatas untuk Initiate New Plan saya sendiri apabila indikator yang relevan belum tersedia pada MKI \- SDG global, sehingga inisiatif lokal entitas saya tetap dapat tercatat secara terstruktur. |

### **4.2 Detailed Specification**

1. Platform Administrator: Refer to `./platform-administrator.md`
1. Platform Administrator: Refer to `./platform-administrator.md`

<!-- image refs -->

[image2]: images/image2.png
[image3]: images/image3.png
