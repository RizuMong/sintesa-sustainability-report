# **MODULE 2: SUSTAINABILITY REPORTING PORTAL**

Modul Sustainability Reporting Portal digunakan oleh PIC SR Holding untuk mengelola Modul _Sustainability Reporting Portal_ dirancang untuk memfasilitasi PIC SR Holding dalam mengelola arsitektur strategi pelaporan skala grup, mereview standardisasi _submission_ dari _Subsidiary_, serta memantau performa konsolidasi seluruh entitas.

Di sisi lain, modul ini berfungsi sebagai pusat operasional bagi _Sustainability Subsidiary PIC_ di setiap anak perusahaan untuk menginput data laporan keberlanjutan mereka. Untuk menjaga konsistensi, seluruh formulir yang ditampilkan bersifat dinamis dan dirender secara otomatis berdasarkan _template_ terpusat yang dirilis oleh Holding.

## **2.1 GRI Management — Rilis Template Pelaporan Tahunan**

**Explanations**

PIC SR Holding membuat rilis pelaporan GRI per tahun buku (e.g., 'Pelaporan Tahun Buku 2026') dan memetakan (mapping) indikator dari MKI ke dalam kerangka pelaporan tersebut. Rilis ini terdiri dari dua kategori: GRI Quantitative (menggunakan indikator bertipe GRI\_QUANT) dan GRI Qualitative (menggunakan indikator bertipe GRI\_QUAL dengan struktur nested Q\&A form builder). Begitu rilis dipublikasikan, sistem secara otomatis meregenerasi form sheet kosong di portal seluruh Subsidiary.

**Business Rules**

- PIC SR Holding membuat satu Rilis GRI per tahun buku. Satu rilis dapat memiliki banyak Disclosure, masing-masing terhubung ke satu MKI.

- Disclosure kategori GRI\_QUANT: PIC SR Holding memilih indikator via lookup MKI bertipe GRI\_QUANT. Input Type, Unit, dan Evidence diwarisi otomatis dari konfigurasi MKI.

- **Disclosure kategori GRI\_QUAL (Nested Q\&A Builder):** PIC SR Holding menyusun sub-pertanyaan (Question) secara bebas per Disclosure. Setiap Question memiliki: (a) Question Text, dan (b) Follow-up Mode: Conditional (label follow-up beda untuk Ya/Tidak), Single (satu label follow-up untuk keduanya), atau None (hanya toggle Boolean). Semua textarea follow-up bersifat opsional bagi Subsidiary PIC.

- Begitu Rilis GRI dipublikasikan (Published), sistem secara otomatis mendistribusikan form sheet kosong ke portal seluruh Subsidiary aktif dan mengirimkan notifikasi.

- Template GRI yang sudah Published dan memiliki submission aktif tidak dapat diubah strukturnya langsung; PIC SR Holding wajib menerbitkan versi baru.

**Acceptance Criteria**

- AC-38: Given PIC SR Holding menerbitkan Rilis GRI 'Pelaporan Tahun Buku 2026', then sistem secara otomatis mendistribusikan form sheet kosong ke seluruh Subsidiary aktif dan mengirimkan notifikasi kepada Sustainability Subsidiary PIC.

- AC-39: Given PIC SR Holding menambahkan Disclosure GRI\_QUANT dan memilih indikator dari MKI, then kolom Input Type, Unit, dan Evidence otomatis terisi dari konfigurasi MKI terkait dan bersifat read-only.

- AC-40: Given PIC SR Holding membuat Disclosure GRI\_QUAL dengan Question ber-mode Conditional, then Subsidiary PIC akan melihat satu textarea dengan label berbeda tergantung jawaban toggle (Ya atau Tidak).

- AC-41: Given PIC SR Holding membuat Disclosure GRI\_QUAL dengan Question ber-mode None, then Subsidiary PIC hanya melihat toggle Boolean tanpa textarea tambahan.

- AC-42: Given PIC SR Holding mencoba mengubah struktur Disclosure pada Rilis GRI yang sudah Published dan memiliki submission aktif, then sistem menolak perubahan langsung dan mengarahkan untuk menerbitkan versi baru.

**Mockup / Screen Reference**

_**![][image41]![][image42]![][image43]**_

## **2.2 SDG Adoption Management**

**Explanations**

Sistem menyediakan daftar master 17 poin SDG standar PBB secara default lengkap dengan ikon resmi. PIC SR Holding memiliki kendali penuh untuk menyalakan atau mematikan flag (Adopted/Not Adopted) pada masing-masing SDG sesuai fokus materialitas Sintesa Group pada tahun berjalan. Status adopsi ini menentukan governance aktivasi Initiate New Plan (dahulu Local Initiative Plan) di Subsidiary: SDG Adopted diproses otomatis aktif tanpa approval karena sudah sesuai roadmap resmi, sedangkan SDG Non-Adopted wajib melalui approval Holding sebagai kontrol atas inisiatif di luar roadmap resmi.

**Business Rules**

- Daftar 17 SDG global bersifat hardcoded dari kerangka PBB; PIC SR Holding hanya dapat mengubah status adopsi, tidak dapat menambah atau menghapus SDG dari daftar.

- SDG berstatus Not Adopted tidak dapat dijadikan Parent SDG pada SDG Framework resmi Holding.

- Perubahan status adopsi SDG dari Adopted menjadi Not Adopted diblokir jika sudah ada Action Plan Matrix aktif yang menggunakan SDG tersebut sebagai Parent.

- Status adopsi SDG menentukan governance Initiate New Plan Subsidiary: SDG Adopted (Sesuai Roadmap) → auto-Active tanpa approval Holding; SDG Non-Adopted (Luar Roadmap) → wajib approval Holding sebelum aktif, disertai flag permanen 'Unverified / Non-Official SDG'.

- Riwayat perubahan status adopsi tersimpan sebagai audit trail (waktu, identitas PIC SR Holding).

**Acceptance Criteria**

- AC-43: Given PIC SR Holding mengubah status suatu SDG dari Not Adopted menjadi Adopted dan menyimpan, then sistem memperbarui status dan mencatat audit trail perubahan.

- AC-44: Given PIC SR Holding mencoba membuat Action Plan Matrix resmi dengan SDG Non-Adopted sebagai Parent, then sistem tidak menampilkan opsi SDG tersebut karena belum diadopsi Sintesa Group.

- AC-45: Given PIC SR Holding mencoba mengubah SDG Adopted menjadi Not Adopted sementara Action Plan Matrix aktif menggunakan SDG tersebut, then sistem menolak perubahan.

**Mockup / Screen Reference**

_**![][image44]**_

_**![][image45]**_

_**![][image46]**_

## **2.3 SDG Framework (Parent SDG \+ Action Plan Matrix)**

**Explanations**

PIC SR Holding menyusun SDG Framework dengan struktur Parent-Child: Parent adalah SDG (dari daftar SDG Adopted), dan Child adalah baris-baris Action Plan Matrix yang memetakan aksi korporasi terhadap SDG tersebut. Framework yang dipublikasikan otomatis terdistribusi ke seluruh Subsidiary sebagai daftar tugas wajib yang perlu direspons (Take/Skip).

Setiap SDG yang dipilih pada SDG Framework juga diklasifikasikan berdasarkan Impact Type melalui dropdown/single-selection pada halaman detail: Operation Impact atau Investment Impact. Pilihan ini muncul setelah PIC SR Holding memilih SDG saat menyusun framework.

**Field Requirement — Action Plan Matrix**

| Field                    | Tipe / Komponen UI            | Keterangan                                                       |
| :----------------------- | :---------------------------- | :--------------------------------------------------------------- |
| No Code                  | Text Input (Unik dalam SDG)   | Kode unik identitas baris Action Plan, e.g., SDG4-001.           |
| SDG Parent               | Auto-lookup (read-only badge) | Terisi otomatis dari SDG Parent yang dipilih.                    |
| Pillar Area              | Dropdown Select               | Lookup dari Master Pillar/Area Strategy.                         |
| Key Business Action      | Text Area                     | Deskripsi aksi korporasi skala makro.                            |
| Detail Action & Solution | Text Area                     | Penjabaran operasional aksi solusi tingkat tapak.                |
| Action Indicator         | Dropdown Select               | Lookup ke MKI bertipe SDG\_ACTION.                               |
| SDGs/GRI Alignment       | Text Input                    | Keterangan pemetaan silang (cross-alignment reference).          |
| created\_by\_level       | ENUM (Auto-system)            | Nilai hardcoded 'Holding' untuk semua baris yang dibuat Holding. |

**Business Rules**

- Impact Type — Operation Impact: dapat dipilih dan berlaku untuk semua entitas bisnis tanpa pengecualian.

- Impact Type — Investment Impact: hanya dapat dipilih apabila Entity Framework tersebut termasuk dalam daftar entitas berdampak investasi yang dikonfigurasi Administrator (contoh: SDS, SBG, MEPPO). Jika entitas tidak termasuk daftar tersebut, opsi Investment Impact disembunyikan/di-disable pada dropdown.

- No Code wajib unik dalam satu SDG Framework untuk mendukung traceability pelaporan realisasi.

- Action Plan Matrix yang sudah Published dan memiliki Subsidiary yang melakukan Take tidak dapat dihapus secara keseluruhan.

- Kolom created\_by\_level otomatis bernilai 'Holding' untuk semua baris yang dibuat oleh PIC SR Holding.

- Konfigurasi Impact Type dan Entity Scope (toggle Is Applied to All Entity beserta Applicable Entities) ditetapkan satu kali per SDG Parent yang ditambahkan ke Framework, dan berlaku untuk seluruh baris Action Plan Matrix (Child) di bawah SDG Parent tersebut.

- Jika toggle Is Applied to All Entity \= Ya, field Applicable Entities disembunyikan dan tidak perlu diisi; seluruh baris Action Plan Matrix di bawah SDG tersebut akan didistribusikan ke SELURUH entitas berstatus Active pada saat proses publish/Generate Action Plan dijalankan (lihat Module 1 section 1.6).

- Jika toggle Is Applied to All Entity \= Tidak, field Applicable Entities wajib diisi minimal satu entitas sebelum SDG Framework dapat disimpan.

- Entitas yang dapat dipilih pada Applicable Entities dibatasi hanya entitas berstatus Active pada Master Entity.

- Proses Generate Action Plan (Module 1 section 1.6) wajib menghormati scoping ini — entitas di luar Applicable Entities tidak menerima draf Action Plan Submission untuk SDG tersebut, meskipun berstatus Active.

**Acceptance Criteria**

- AC-46: Given PIC SR Holding mempublikasikan SDG Framework, then sistem mendistribusikan Action Plan Matrix ke seluruh Subsidiary aktif dan memunculkannya sebagai daftar tugas yang perlu direspons.

- AC-47: Given PIC SR Holding memilih sebuah SDG saat menyusun Action Plan Matrix, then sistem menampilkan pilihan Impact Type (Operation Impact / Investment Impact) pada halaman detail, dengan opsi Investment Impact hanya aktif untuk entitas yang terdaftar sebagai entitas berdampak investasi (mis. SDS, SBG, MEPPO).

- AC-48: Given PIC SR Holding mencoba memilih Investment Impact untuk entitas yang tidak terdaftar sebagai entitas berdampak investasi, then sistem mencegah pemilihan tersebut dan hanya mengizinkan Operation Impact.

- AC-49: Given PIC SR Holding memilih SDG dan Impact Type lalu mengaktifkan toggle Is Applied to All Entity menjadi Ya, then field Applicable Entities disembunyikan/tidak wajib diisi, dan seluruh baris Action Plan Matrix di bawah SDG tersebut ditandai untuk didistribusikan ke seluruh entitas berstatus Active.

- AC-50: Given PIC SR Holding menonaktifkan toggle Is Applied to All Entity (memilih Tidak), then sistem menampilkan field Applicable Entities berupa multi-select dan mewajibkan minimal satu entitas dipilih sebelum SDG Framework dapat disimpan.

- AC-51: Given PIC SR Holding memilih Tidak pada toggle namun tidak memilih entitas apa pun pada Applicable Entities lalu mencoba menyimpan, then sistem menampilkan validasi bahwa minimal satu entitas wajib dipilih dan menolak penyimpanan.

- AC-52: Given SDG Framework dikonfigurasi dengan Applicable Entities terbatas pada Entity A dan Entity B, then proses Generate Action Plan hanya membuat draf Action Plan Submission untuk Entity A dan Entity B, tidak untuk entitas lain meskipun berstatus Active.

- AC-53: Given PIC SR Holding mencoba menambahkan baris Action Plan dengan No Code yang sama pada SDG yang sama, then sistem menampilkan validasi duplikasi dan menolak penyimpanan.

- AC-54: Given PIC SR Holding mencoba menghapus SDG Framework yang sudah ada Subsidiary melakukan Take pada salah satu barisnya, then sistem menolak penghapusan keseluruhan.

**Mockup / Screen Reference**

_**![][image47]**_

_**![][image48]**_

_**![][image49]**_

_**![][image50]**_

_**![][image51]**_

_**![][image52]**_

## **2.4 Review & Approval (Holding & Subsidiary — Entity-Scoped Approval Routing)**

**Explanations**

Pusat kendali evaluasi atas seluruh data kiriman Subsidiary/Branch, digunakan pada satu menu yang sama baik oleh PIC SR Holding maupun oleh PIC Subsidiary yang bertindak sebagai approver bagi Branch di bawahnya. Dibagi menjadi tiga tab utama: GRI Quantitative Review, GRI Qualitative Review, dan Action Plan Realization Review.

Siapa yang menjadi approver pada suatu submission ditentukan secara dinamis oleh Workflow Configuration (field approval\_type, lihat 1.6) — bukan oleh menu yang berbeda: 'Holding Approval' menampilkan submission ke PIC SR Holding, sedangkan 'By PIC' menampilkan submission ke PIC Subsidiary induk dari entitas pengirim (mis. Branch). Baik PIC SR Holding maupun PIC Subsidiary menggunakan Bulk Approve untuk efisiensi atau Detail Review untuk peninjauan mendalam, masing-masing terbatas pada scope submission miliknya.

Catatan Fase Implementasi: submission oleh entitas Branch belum aktif pada fase awal (lihat Out of Scope); mekanisme routing 'By PIC' pada bagian ini dirancang untuk kesiapan (scalability) perluasan sistem ke level Branch di kemudian hari, dan belum digunakan secara operasional saat go-live awal.

**Business Rules**

- Saat Subsidiary/Branch mengirimkan data, status dokumen berubah menjadi Submitted. Sistem mendeteksi Workflow Configuration yang berlaku dan mendistribusikan ke Approver Level 1 sesuai approval\_type: 'Holding Approval' (PIC SR Holding) atau 'By PIC' (PIC entitas Parent pengirim, mis. PIC Subsidiary induk dari Branch).

- Mekanisme Approval Line: jika dikonfigurasi lebih dari satu level, dokumen harus disetujui bertahap oleh Approver Level 1 kemudian level berikutnya. Dokumen tidak dapat diteruskan ke level berikutnya sebelum disetujui level sebelumnya.

- Untuk submission dari Branch, Approval Line Level 1 default merujuk pada approval\_type \= 'By PIC' pada Subsidiary induk (parent\_entity\_id); Holding hanya menerima submission pada level eskalasi berikutnya jika Approval Line dikonfigurasikan lebih dari satu level.

- Untuk submission dari Subsidiary tanpa Branch di bawahnya, Approval Line mengikuti konfigurasi default approval\_type \= 'Holding Approval', langsung masuk ke antrian PIC SR Holding.

- Keputusan Reject: jika approver menolak (baik PIC SR Holding maupun PIC Subsidiary), status berubah menjadi Rejected dan kolom Reviewer Notes wajib diisi. Sistem mengirimkan notifikasi kepada pengirim beserta catatan revisi.

- Bulk Approve: approver dapat memilih N dokumen berstatus Submitted dari list view dalam scope-nya sendiri dan menyetujui sekaligus tanpa membuka detail masing-masing.

- RBAC pada platform Officeless tetap dibatasi di level App/Page; scoping data (submission mana saja yang dapat dilihat/diapprove oleh seorang approver) dikendalikan melalui filter query berbasis Entity ID pengguna yang login dan struktur self-referencing Master Entity (parent\_entity\_id), bukan oleh matriks RBAC App/Page itu sendiri — sehingga PIC Subsidiary hanya melihat submission Branch dalam scope entitasnya sendiri.

- Setiap keputusan (Approve/Reject) tercatat dalam audit log (waktu, identitas approver, keputusan, catatan), terlepas apakah approver adalah PIC SR Holding atau PIC Subsidiary.

**Acceptance Criteria**

- AC-55: Given Submission GRI Quantitative dari Entity A dikirimkan dan Workflow dikonfigurasi 2 level, then dokumen pertama kali muncul di antrean Approver Level 1 dan belum tampil untuk Approver Level 2\.

- AC-56: Given sebuah Branch mengirimkan GRI Submission dan Workflow Configuration entitas tersebut memiliki Approval Line Level 1 dengan approval\_type \= 'By PIC', then submission diteruskan ke PIC Subsidiary induk dari Branch tersebut, bukan langsung ke PIC SR Holding.

- AC-57: Given PIC Subsidiary menyetujui submission Branch pada Approval Line Level 1 'By PIC', then submission diteruskan ke level berikutnya sesuai konfigurasi (mis. Holding, jika dikonfigurasikan) atau langsung berstatus Approved jika tidak ada level lanjutan.

- AC-58: Given sebuah Subsidiary tanpa Branch di bawahnya mengirimkan submission, then Approval Line mengikuti konfigurasi default approval\_type \= 'Holding Approval' dan submission langsung masuk ke antrian PIC SR Holding.

- AC-59: Given PIC Subsidiary membuka menu Approval, then sistem hanya menampilkan submission Branch dalam scope entitasnya sendiri berdasarkan parent\_entity\_id, dan tidak menampilkan submission Branch milik Subsidiary lain.

- AC-60: Given PIC SR Holding atau PIC Subsidiary memilih keputusan Reject tanpa mengisi Reviewer Notes, then sistem menampilkan validasi bahwa Reviewer Notes wajib diisi dan menolak eksekusi keputusan.

- AC-61: Given approver mengisi Reviewer Notes dan memilih Reject, then status submission berubah menjadi Rejected dan pengirim (Subsidiary/Branch PIC) menerima notifikasi beserta catatan revisi.

- AC-62: Given approver memilih N dokumen berstatus Submitted dalam scope-nya dan menekan Bulk Approve, then seluruh dokumen yang dipilih berubah status menjadi Approved dan sistem mencatat audit log.

- AC-63: Given submission berstatus Rejected diperbaiki dan di-resubmit oleh pengirim, then dokumen kembali masuk ke antrean Approver Level 1 sesuai Workflow Configuration yang berlaku (Holding Approval atau By PIC).

**Mockup / Screen Reference**

_**\[Insert Mockup Here \- Manual Input\]**_

## **2.5 Action Plan Change Request — Approval (Holding)**

**Explanations**  
Halaman ini digunakan PIC SR Holding untuk mengevaluasi pengajuan Action Plan Change Request dari seluruh Subsidiary. Mengikuti mekanisme Review & Approval standar, namun objek yang dievaluasi adalah perubahan yang diajukan atas Action Plan yang sudah berjalan, bukan submission baru.  
**Business Rules**

- PIC SR Holding melihat perbandingan data lama (existing) vs data yang diajukan (proposed) pada satu tampilan, beserta Notes/Reason dari Subsidiary.

- Keputusan Approve menerapkan perubahan ke data Action Plan dan mencatat Approved Date & Approved By; keputusan Reject mengharuskan Reviewer Notes wajib diisi dan data Action Plan tetap seperti semula.

- Seluruh keputusan (Approve/Reject) atas Change Request tercatat pada audit log yang sama dengan Review & Approval submission lain (waktu, identitas approver, keputusan, catatan).

**Acceptance Criteria**

- AC-64: Given PIC SR Holding membuka suatu Action Plan Change Request, then sistem menampilkan proposed plan beserta Notes/Reason pengajuan.

- AC-65: Given PIC SR Holding menyetujui Change Request, then data Action Plan diperbarui sesuai pengajuan dan status Change Request menjadi Approved.

- AC-66: Given PIC SR Holding menolak Change Request tanpa mengisi Reviewer Notes, then sistem menampilkan validasi dan menolak penyimpanan keputusan.

**Mockup / Screen Reference**

_**\[Insert Mockup Here \- Manual Input\]**_

## **2.6 Performance Tracking Dashboard**

**Explanations**

Dashboard grid yang memantau kelengkapan submission dari seluruh Subsidiary secara real-time. Menampilkan persentase completion per entitas, per periode, dan per tipe submission dengan status visual (Draft, Submitted, Approved, Rejected).

**Business Rules**

- Status ditampilkan real-time mengikuti perubahan status dokumen pada proses Review & Approval.

- PIC SR Holding dapat mengirimkan manual nudge (pengingat manual) kepada Subsidiary yang terlambat langsung dari tracker.

- Item Initiated Plan Subsidiary berstatus Unverified/Non-Official SDG ditampilkan dengan flag visual berbeda dari item Action Plan resmi Holding.

**Acceptance Criteria**

- AC-67: Given terdapat perubahan status submission, then Performance Tracking Dashboard memperbarui status secara real-time tanpa memerlukan refresh manual.

- AC-68: Given PIC SR Holding menekan tombol pengingat manual pada Subsidiary yang overdue, then sistem mengirimkan notifikasi manual ke Sustainability Subsidiary PIC entitas tersebut.

- AC-69: Given Initiate New Plan Subsidiary berstatus Unverified/Non-Official SDG tampil di tracker, then item tersebut memiliki label visual berbeda dari item Action Plan resmi yang berasal dari SDG Framework Holding.

**Mockup / Screen Reference**

_**\[Insert Mockup Here \- Manual Input\]**_

## **2.7 Strategic Insight Dashboard** {#2.7-strategic-insight-dashboard}

### **2.7.1 Sustainable Development Goals Insight** {#2.7.1-sustainable-development-goals-insight}

**Explanations**

Dashboard dirancang sebagai "Digital Executive Briefing" interaktif yang membandingkan strategi Holding (Top-Down Roadmap) dengan eksekusi di level Subsidiary (Bottom-Up Execution). Dashboard ini berfokus pada visibilitas Take vs Skip pada Action Plan, gap keselarasan strategis (Strategic Alignment Gap), dan inovasi lokal dari anak perusahaan.

Dirancang khusus untuk level C-Suite/Eksekutif, antarmuka ini mengusung prinsip zero-hover dependency (semua angka persentase eksplisit terlihat tanpa kursor) dan Print-Ready (dapat langsung dicetak menjadi dokumen briefing A4). Endpoint API dashboard dirancang menggunakan Data Aggregation Pipeline atau Database View Engine untuk menghindari bottleneck query terhadap data massal.

Komponen utama dashboard mencakup:

1. Global KPI Cards: Meliputi Holding SDG Roadmap, Strategic Alignment %, Execution Rate (Take), dan Bottom-Up Initiatives.
2. Strategic Action Matrix (Aggregated): Matriks yang menampilkan persentase Take Rate dari berbagai indikator aksi per SDG, serta menyoroti inisiatif lokal (Bottom-Up) pada SDG di luar roadmap utama.
3. Strategic Alignment Gap Chart: Grafik komparasi full-width antara volume aksi yang selaras dengan Holding (Aligend) vs inisiatif di luar Holding (Initiated).
4. Action Plan Drill-Down Details: Tabel rincian interaktif yang muncul saat matriks diklik, menampilkan daftar Action Plan spesifik beserta Skip Reason.

**Business Rules**

- Approved Data Only: Hanya data (submission) berstatus Approved yang masuk dalam kalkulasi agregat; data Draft/Submitted/Rejected tidak ditampilkan dalam visualisasi.

- Strict Execution Rate Calculation (Anti-Greenwashing): Kalkulasi persentase pada kolom "Total Execution (Holding Mandates)" HANYA menggunakan data Action Plan yang berasal dari Holding Adopted SDGs (Top-Down). Action Plan dari inisiatif lokal (Bottom-Up) tidak diikutsertakan dalam pembagi/pengali persentase ini agar tidak mengaburkan tingkat kepatuhan subsidiary terhadap Holding.

- Execution Status Tagging: Setiap Action Plan diagregasi berdasarkan status eksekusinya: Take (Eksekusi mandat), Skip (Mengabaikan mandat, wajib melampirkan skip\_reason), dan Initiated (Inisiatif Bottom-up mandiri).

- Visual Separation: Data Bottom-Up (Initiate New Plan) ditampilkan pada kolom/warna terpisah dari Official Holding Adopted SDGs.

- Print-Ready UI: Angka persentase dan label data harus tertera langsung pada elemen grafik (bar) dan matriks secara default, tanpa mewajibkan interaksi hover (kursor) dari pengguna.

- Global Filters: Dashboard menyediakan filter global berdasarkan Periode Pelaporan (Tahun) dan Subsidiary Entity (termasuk opsi "All Entities").

**Acceptance Criteria**

- AC-70: Given terdapat submission berstatus Submitted atau Rejected dan PIC SR Holding membuka Strategic Insight Dashboard, then submission tersebut tidak diikutsertakan dalam kalkulasi agregat chart.

- AC-71: Given PIC SR Holding menerapkan filter periode dan Entity, then seluruh chart pada dashboard memperbarui tampilannya hanya dengan data yang sesuai filter.

- AC-72: Given terdapat Initiate New Plan berstatus Unverified pada dashboard, then data tersebut ditampilkan terpisah dengan indikator visual berbeda dari data Official SDG Adopted.

**Mockup / Screen Reference**

![][image53]

### **2.7.1 Global Reporting Initiative Insight** {#2.7.1-global-reporting-initiative-insight}

**Explanations**

GRI Standards Dashboard adalah antarmuka analitik interaktif yang dirancang untuk memvisualisasikan data kuantitatif Environmental, Social, and Governance (ESG) Grup berdasarkan kerangka pelaporan Global Reporting Initiative (GRI). Berbeda dengan matriks SDG, dashboard ini difokuskan pada metrik operasional spesifik yang dibagi ke dalam 8 kategori tematik utama (seperti Energi, Limbah, Air, Keanekaragaman, hingga K3).

Dashboard ini memungkinkan peninjauan tren multi-tahun (2023–2025) dan komparasi antar anak perusahaan (PT).

Komponen utama meliputi:

1. Global Filters & Dynamic Subtitle: Filter dropdown untuk "Perusahaan" (PT) dan "Tahun" yang secara langsung memperbarui label teks penunjuk data aktif.
2. Thematic Navigation Tabs: 8 tab kategori metrik (General, Energy, Waste, Water, Diversity, Employment, OHS, Training) yang mendasari perubahan data di layar.
3. Dynamic KPI Cards: Kartu ringkasan angka atas untuk metrik kritikal (Total, Rata-rata, atau Persentase) sesuai kategori tab.
4. Analytical Charts: Visualisasi distribusi dan tren (menggunakan Bar, Line, Pie, dan Doughnut chart) beserta perbandingan performa antar PT.

**Business Rules**

- Data Aggregation Logic: Jika pengguna memilih "Semua PT" atau "Semua tahun", sistem wajib melakukan agregasi otomatis (penjumlahan untuk nilai absolut seperti total limbah, atau perhitungan rata-rata/persentase untuk rasio seperti komposisi gender) dari seluruh entitas dan periode yang tersedia.

- Thematic Categorization (GRI Mapping): Data harus dipisahkan dan dirender secara eksklusif berdasarkan kategori tab yang aktif:

* General: Metrik GRI 2-7 & 2-8 (Demografi, Gender, dan Status Karyawan/Non-karyawan).
* Energy: Metrik GRI 302-1 (Konsumsi energi Renewable vs Non-Renewable).
* Waste: Metrik GRI 306-4 & 306-5 (Pengelolaan limbah Divert vs Disposal).
* Water: Metrik GRI 303-3 & 303-4 (Penarikan dan pembuangan air).
* Diversity & Equal Opp.: Metrik GRI 405-1 & 405-2 (Keragaman governance dan rasio gaji).
* Employment: Metrik GRI 401-1 & 401-3 (Rekrutmen baru dan cuti orang tua).
* OHS: Metrik GRI 403-9 (Insiden K3, Fatality, dan Jam Kerja).
* Training & Education: Metrik GRI 404-1 (Rata-rata jam pelatihan karyawan).

- UI Interactivity: Kartu KPI dan seluruh chart harus bereaksi (refresh) seketika tanpa memuat ulang halaman (page reload) saat filter global atau tab diubah.

**Acceptance Criteria**

- AC-73: Given PIC SR Holding membuka GRI Standards Dashboard, when pengguna mengklik salah satu _Thematic Tab_ (contoh: "Energy"), then sistem hanya menampilkan KPI dan _chart_ yang relevan dengan metrik GRI 302-1, dan menyembunyikan metrik kategori lainnya.

- AC-74: Given pengguna mengubah filter "Perusahaan" menjadi entitas spesifik (contoh: "WS") dan filter "Tahun" menjadi "2024", then sistem mengkalkulasi ulang seluruh KPI dan _chart_ hanya menggunakan data milik entitas WS pada tahun 2024\.

- AC-75: Given pengguna memilih "Semua PT" pada filter "Perusahaan", then sistem menjumlahkan metrik absolut (seperti Total Karyawan atau Total Limbah) dan menghitung nilai gabungan untuk metrik rasio/rata-rata dari seluruh anak perusahaan.

- AC-76: Given pengguna mengubah kombinasi filter global, then teks _Subtitle_ pada layar secara dinamis berubah (contoh: "Menampilkan: WS · 2025") untuk mencerminkan parameter filter yang sedang aktif.

- AC-77: Given pengguna berada pada _tab_ "General", then sistem memunculkan grafik perbandingan (PT Comparison bar) yang membandingkan metrik antar entitas untuk memberikan konteks komparatif.

**Mockup / Screen Reference**

![][image54]

## **2.8 Data Export & Report**

**Explanations**

Mesin ekstraksi data konsolidasi menjadi file flat .csv terstruktur untuk diolah oleh LCI sebagai base data penyusunan laporan keberlanjutan publikasi tahunan. Tersedia dua skema ekspor: Export GRI Disclosure (Quantitative & Qualitative) dan Export SDG/Action Plan Realization.

**Business Rules**

- Hanya data berstatus Approved yang dapat dimasukkan dalam file ekspor.

- PIC SR Holding dapat memfilter ekspor berdasarkan: periode pelaporan, Entity/Branch, dan kategori data (GRI/SDG/Realization).

- Setiap aktivitas ekspor tercatat dalam audit log: waktu ekspor, filter yang digunakan, identitas PIC SR Holding.

**Acceptance Criteria**

- AC-78: Given PIC SR Holding memilih filter periode, Entity, dan kategori GRI Disclosure lalu menekan Export, then sistem menghasilkan file .csv yang hanya memuat data GRI Disclosure berstatus Approved pada filter tersebut.

- AC-79: Given proses ekspor berhasil, then sistem mencatat aktivitas ekspor dalam audit log mencakup waktu, dan identitas eksportir.

**Mockup / Screen Reference**

_**![][image55]**_

## **2.9 GRI Submission — Quantitative**

**Explanations**

Sustainability Subsidiary PIC disajikan dasbor pelaporan dinamis yang merender komponen input secara otomatis berdasarkan template GRI Quantitative yang dirilis oleh Holding. Rendering komponen mengikuti konfigurasi Input Type dan Unit dari Master Key Indicator yang dipetakan pada template tersebut. Seluruh indikator HR (Total Headcount, Gender Diversity, Age Demographics, Employee Movement, dsb.) yang sebelumnya terpisah kini terintegrasi sebagai bagian dari GRI Quantitative dengan tipe GRI\_QUANT.

**Business Rules — Dynamic Validation Engine**

| Input Type (Konfigurasi MKI) | Perilaku Komponen UI di Subsidiary                 | Aturan Validasi Sistem                                                               |
| :--------------------------- | :------------------------------------------------- | :----------------------------------------------------------------------------------- |
| Number                       | Text Input bertipe number                          | Hanya menerima angka desimal atau bulat. Menolak huruf alfabet dan simbol.           |
| Percentage                   | Text Input dengan append simbol %                  | Nilai wajib berada dalam rentang 0 hingga 100\.                                      |
| Boolean                      | Radio Button atau Toggle Switch                    | Pilihan mutlak: True (Ya) atau False (Tidak).                                        |
| Evidence \= Required         | File Uploader Box (pdf/jpg/png/docx/csv) (Max 4MB) | Tombol Submit terkunci hingga file dengan ekstensi yang diizinkan berhasil diunggah. |

- Sistem menyimpan data dalam status Draft selama proses pengisian; setelah Submit, status berubah menjadi Submitted dan form terkunci (read-only).

- Dokumen berstatus Rejected dapat dibuka kembali oleh Subsidiary PIC untuk diperbaiki dan di-resubmit.

**Acceptance Criteria**

- AC-80: Given Sustainability Subsidiary PIC membuka halaman GRI Submission Quantitative, then sistem merender komponen input secara otomatis sesuai template GRI Quantitative yang dirilis Holding untuk periode aktif.

- AC-81: Given indikator ber-Input Type 'Number' dan Subsidiary PIC memasukkan karakter huruf alfabet, then sistem menolak input dan hanya menerima angka desimal atau bulat.

- AC-82: Given indikator ber-Input Type 'Percentage' dan Subsidiary PIC memasukkan nilai di atas 100, then sistem menampilkan validasi bahwa nilai harus diantara 0 dan 100\.

- AC-83: Given indikator memiliki Evidence \= 'Required' dan Subsidiary PIC belum mengunggah file, then sistem menolak submit hingga file pdf atau jpg berhasil diunggah.

- AC-84: Given Subsidiary PIC berhasil menekan Submit pada GRI Submission Quantitative, then status dokumen berubah menjadi Submitted dan form terkunci read-only.

- AC-85: Given dokumen GRI Quantitative dikembalikan dengan status Rejected, then Subsidiary PIC dapat membuka kembali formulir, memperbaiki data sesuai Reviewer Notes, dan melakukan resubmit.

- AC-86: Given pada entitas dan periode aktif yang sama sudah terdapat submission GRI Quantitative berstatus Draft, Submitted, atau Approved untuk template tersebut, then sistem mencegah pembuatan instance submission baru, sehingga tidak terjadi duplikasi data untuk entitas dan periode yang sama.

**Mockup / Screen Reference**

_**![][image56]**_

_**![][image57]**_

## **2.10 GRI Submission — Qualitative**

**Explanations**

GRI Submission Qualitative merender formulir nested Q\&A yang strukturnya ditentukan sepenuhnya oleh PIC SR Holding saat membuat template GRI\_QUAL. Setiap Disclosure berisi N Question secara berurutan. Setiap Question memiliki toggle Boolean sebagai trigger utama, diikuti textarea follow-up yang modanya dikonfigurasi Holding (Conditional, Single, atau None).

**Business Rules**

- Toggle Boolean (Ya/Tidak) pada setiap Question bersifat wajib dipilih; sistem menolak Submit apabila ada Question yang togglenya belum diisi.

- Seluruh textarea follow-up bersifat opsional; Subsidiary PIC boleh mengosongkan textarea meskipun toggle sudah dipilih.

- **Rendering per Follow-up Mode:** Conditional → satu textarea dengan label berbeda tergantung jawaban toggle; Single → satu textarea dengan label tunggal selalu tampil; None → hanya toggle Boolean tanpa textarea.

**Acceptance Criteria**

- AC-87: Given Disclosure GRI\_QUAL memiliki Question ber-mode Conditional dan Subsidiary PIC memilih 'Ya' pada toggle, then sistem menampilkan textarea dengan label konfigurasi 'Jika Ya' dari Holding.

- AC-88: Given Subsidiary PIC mengubah jawaban toggle dari 'Ya' ke 'Tidak' pada Question Conditional, then label textarea berubah secara dinamis ke konfigurasi 'Jika Tidak'.

- AC-89: Given Disclosure memiliki Question ber-mode None, then sistem hanya menampilkan toggle Boolean tanpa textarea tambahan.

- AC-90: Given terdapat Question yang togglenya belum dipilih dan Subsidiary PIC menekan Submit, then sistem menampilkan validasi bahwa semua toggle wajib diisi dan menolak proses Submit.

- AC-91: Given Subsidiary PIC telah mengisi semua toggle dan tidak mengisi textarea follow-up (opsional), then sistem mengizinkan proses Submit tanpa validasi error pada textarea.

**Mockup / Screen Reference**

_**![][image58]**_

_**![][image59]**_

## **2.11 Submit Action Plan — Mekanisme Respons Take / Skip (SDG Framework Holding)**

**Explanations**

Subsidiary PIC diwajibkan memberikan respons terhadap setiap baris Action Plan Matrix yang didistribusikan oleh Holding. Tersedia dua tindakan: Take (berkomitmen menjalankan aksi) dan Skip (melewati aksi dengan alasan yang wajib diisi).

**Business Rules — Tindakan Take**

- Ketika Subsidiary PIC memilih Take, sistem langsung memicu (trigger) pembuatan form Report Plan Realization terkait pada alur yang berbeda, sehingga Subsidiary dapat segera memulai pengisian realisasi tanpa berpindah menu secara manual. Jika submission Take disetujui (Approved) oleh Holding, sistem secara otomatis membuat satu instance record pada modul Report Plan Realization, mewajibkan Subsidiary mengisi laporan realisasi secara periodik.

- Item Action Plan yang di-Take ditandai dengan status Taken pada tracker Holding.

- Validation Gate: pengisian dan pengiriman (submit) form Report Plan Realization yang terpicu dari Take akan otomatis diblokir apabila Realization Window pada Master Period periode berjalan belum berstatus Open (lihat 1.2); sistem menampilkan pesan bahwa jendela pelaporan realisasi belum dibuka.

- Setelah Subsidiary PIC mengirimkan (submit) keputusan Take/Skip atas Action Plan Matrix, sistem menyediakan tombol untuk mengunduh dokumen perencanaan tersebut dalam format PDF dan Excel.

**Business Rules — Tindakan Skip**

- Jika Subsidiary PIC memilih Skip, sistem memunculkan pop-up wajib isi berupa Justification Text Area yang harus menjelaskan alasan ketidakrelevanan aksi dengan lini bisnis entitas.

- Justification tidak boleh kosong; sistem menolak penyimpanan Skip tanpa justification.

- Justification yang telah diisi masuk ke halaman Review & Approval Holding untuk dapat ditinjau oleh PIC SR Holding.

**Acceptance Criteria**

- AC-92: Given Subsidiary PIC memilih Take pada Action Plan dan submission diapprove Holding, then sistem secara otomatis membuat instance record pada Report Plan Realization untuk entitas tersebut.

- AC-93: Given Subsidiary PIC memilih Skip pada suatu Action Plan, then sistem memunculkan pop-up Justification Text Area yang wajib diisi sebelum keputusan Skip dapat disimpan.

- AC-94: Given Subsidiary PIC mencoba menyimpan keputusan Skip tanpa mengisi Justification Text Area, then sistem menampilkan validasi bahwa justification wajib diisi dan menolak penyimpanan.

- AC-95: Given Subsidiary PIC berhasil menyimpan Skip dengan justification terisi, then justification tersebut masuk ke halaman Review & Approval Holding dan dapat ditinjau oleh PIC SR Holding.

- AC-96: Given Realization Window pada Master Period periode berjalan berstatus Closed, then Subsidiary PIC tidak dapat mengirimkan (submit) form Report Plan Realization dan sistem menampilkan pesan bahwa jendela pelaporan realisasi belum/tidak dibuka.

- AC-97: Given Subsidiary PIC berhasil mengirimkan (submit) keputusan Take/Skip, then sistem menampilkan tombol unduh dokumen perencanaan dalam format PDF atau Excel.

**Mockup / Screen Reference**

_**![][image60]**_

_**![][image61]**_

_**![][image62]**_

_**![][image63]**_

## **2.12 Initiate New Plan — Inisiatif Mandiri Subsidiary dengan Dual Governance**

**Explanations**

Subsidiary PIC diberikan fleksibilitas membuat kerangka kerja SDG (Parent SDG \+ Action Plan Matrix) mandiri di luar SDG Framework resmi Holding, melalui menu Initiate New Plan pada Sustainability Subsidiary Portal. Subsidiary dapat menginisiasi rencana dari SDG yang sudah diadopsi Sintesa Group maupun dari SDG yang belum diadopsi. Governance aktivasi berbeda berdasarkan status adopsi SDG yang dipilih: SDG Adopted langsung aktif tanpa approval; SDG Non-Adopted wajib melalui approval Holding.

**Business Rules — Flagging & Database Tagging (Hardcoded)**

- Setiap Initiate New Plan yang dibuat Subsidiary wajib secara otomatis diberikan atribut: created\_by\_level \= 'Subsidiary' dan Origin\_Entity\_ID (FK ke entitas pembuat). Atribut ini digunakan query dashboard Holding untuk memfilter inisiatif bottom-up dari instruksi top-down Holding.

**Business Rules — Jalur 1: SDG Adopted (Sesuai Roadmap — Auto-Active)**

- Jika Subsidiary membuat Initiate New Plan dengan referensi SDG Adopted, item langsung berstatus Active/Recorded secara otomatis (AUTO-ACTIVE) tanpa melalui antrian Review & Approval Holding di level Action Plan, karena SDG tersebut sudah sesuai roadmap resmi Sintesa Group.

- Karena berstatus Active secara otomatis, Subsidiary langsung diwajibkan mengisi laporan realisasi (Realization Report) tanpa menunggu approval Action Plan terlebih dahulu.

**Business Rules — Jalur 2: SDG Non-Adopted (Luar Roadmap — Wajib Approval)**

- Jika Subsidiary membuat Initiate New Plan dengan referensi SDG Non-Adopted, item berstatus Pending Review dan wajib masuk ke antrian Review & Approval Holding di level Action Plan sebelum dapat aktif dieksekusi, karena SDG tersebut berada di luar roadmap resmi Sintesa Group.

- Item ini menerima flag ganda: created\_by\_level \= 'Subsidiary' DAN flag 'Unverified / Non-Official SDG'. Flag 'Unverified' bersifat permanen dan tetap melekat meskipun item sudah diapprove Holding, guna membedakannya dari Action Plan resmi hasil SDG Framework.

- Setelah diapprove Holding, item berubah status menjadi Active/Taken dan Subsidiary diwajibkan mengisi laporan realisasi (Realization Report). Realization Report dari jalur ini tetap melalui Review & Approval Holding normal sebelum data masuk konsolidasi.

- Item Unverified tampil di tracker dan dashboard Holding dengan indikator visual berbeda dari item Official.

**Acceptance Criteria**

- AC-98: Given Subsidiary PIC membuat Initiate New Plan dengan referensi SDG Adopted dan menyimpan, then sistem menandai item dengan created\_by\_level \= 'Subsidiary' dan langsung mengaktifkan status Active/Recorded tanpa masuk antrian Review & Approval Holding.

- AC-99: Given Initiate New Plan SDG Adopted berstatus Active, then Subsidiary PIC dapat langsung membuat dan mengirimkan Realization Report tanpa menunggu approval Action Plan.

- AC-100: Given Subsidiary PIC berhasil mengirimkan (submit) Initiate New Plan, then sistem menampilkan tombol unduh dokumen perencanaan dalam format PDF dan Excel, konsisten dengan Submit Action Plan.

- AC-101: Given Subsidiary PIC membuat Initiate New Plan dengan referensi SDG Non-Adopted dan menyimpan, then sistem mencatat item dengan status Pending Review, menambahkan flag created\_by\_level \= 'Subsidiary' dan flag 'Unverified / Non-Official SDG', serta memasukkan item ke antrian Review & Approval Holding.

- AC-102: Given Initiate New Plan SDG Non-Adopted berstatus Pending Review diapprove Holding, then status berubah menjadi Active/Taken dan Subsidiary PIC dapat mengirimkan Realization Report.

- AC-103: Given Subsidiary PIC mengirimkan Realization Report atas Initiate New Plan SDG Adopted maupun SDG Non-Adopted yang sudah berstatus Active, then Realization Report tersebut masuk ke antrian Review & Approval Holding normal dan wajib diapprove sebelum data masuk konsolidasi.

- AC-104: Given Initiate New Plan SDG Non-Adopted tampil di Performance Tracking dan Strategic Insight Dashboard Holding, then item tersebut ditampilkan dengan label visual 'Unverified / Non-Official SDG' yang berbeda dari item resmi SDG Adopted, baik sebelum maupun sesudah diapprove.

**Mockup / Screen Reference**

_**\[Insert Mockup Here \- Manual Input\]**_

## **2.13 Action Plan Change Request (Pengajuan Perubahan Rencana)**

**Explanations**  
Setelah Action Plan (baik dari Submit Action Plan/Take maupun Initiate New Plan) disubmit, Subsidiary PIC tidak dapat mengubah datanya secara langsung. Untuk mengakomodasi kebutuhan perubahan di tengah periode (mis. pemotongan anggaran atau instruksi program baru dari manajemen), disediakan menu Action Plan Change Request yang memungkinkan Subsidiary mengajukan perubahan, dengan approval wajib dari Holding sebelum perubahan berlaku.  
**Business Rules**

- Subsidiary PIC memilih satu Action Plan (Taken/Active) yang sudah disubmit sebagai objek perubahan, lalu mengisi field perubahan yang diajukan beserta Notes/Reason (wajib diisi) yang menjelaskan alasan perubahan (mis. rencana tidak sesuai kondisi lapangan, atau perubahan kebijakan/instruksi manajemen).

- Pengajuan Change Request berstatus Pending Review dan masuk ke antrian approval Holding; Action Plan asal tetap berjalan dengan data lama hingga Change Request disetujui.

- Setelah Change Request disetujui (Approved) oleh Holding, sistem memperbarui data Action Plan sesuai perubahan yang diajukan; jika ditolak (Rejected), data Action Plan tidak berubah dan Reviewer Notes wajib diisi oleh Holding.

- Sistem mencatat audit trail lengkap untuk setiap Change Request: Request Date, Request By, Approved Date, Approved By, dan Notes/Reason — ditampilkan secara transparan pada riwayat perubahan tiap Action Plan.

**Acceptance Criteria**

- AC-105: Given Subsidiary PIC mengajukan Action Plan Change Request dengan Notes/Reason terisi, then sistem menyimpan pengajuan berstatus Pending Review beserta Request Date dan Request By, dan memasukkannya ke antrian approval Holding.

- AC-106: Given Subsidiary PIC mencoba mengajukan Change Request tanpa mengisi Notes/Reason, then sistem menampilkan validasi dan menolak penyimpanan.

- AC-107: Given sebuah Action Plan Change Request disetujui Holding, then data Action Plan terkait diperbarui sesuai pengajuan dan sistem mencatat Approved Date serta Approved By pada audit trail.

- AC-108: Given Subsidiary PIC membuka riwayat suatu Action Plan, then sistem menampilkan seluruh Change Request beserta status dan audit trail-nya (Request/Approved Date & By, Notes/Reason) secara transparan.

**Mockup / Screen Reference**

_**![][image64]![][image65]**_

## **2.14 Report Plan Realization & Dynamic Validation Engine**

**Explanations**

Halaman ini digunakan Subsidiary PIC untuk melaporkan bukti eksekusi dari rencana aksi yang berstatus Active/Taken (dari SDG Framework Holding melalui Submit Action Plan, maupun dari Initiate New Plan yang sudah aktif). Formulir bersifat dinamis mengikuti konfigurasi Input Type dan Evidence dari Master Key Indicator pada Action Indicator masing-masing item. Semua Realization Report — dari Action Plan resmi Holding, Initiate New Plan SDG Adopted (auto-Active), maupun Initiate New Plan SDG Non-Adopted (setelah Approved) — wajib melalui Review & Approval Holding sebelum data masuk konsolidasi.

**Business Rules**

- Formulir input bersifat dinamis sepenuhnya mengikuti aturan arsitektur data indikator induk yang dikonfigurasi di MKI (Input Type, Evidence). Lihat tabel Dynamic Validation Engine pada section 3.1.

- Pelaporan realisasi dilakukan secara periodik sesuai jadwal yang dikonfigurasi pada Periodic Notification; satu item dapat memiliki lebih dari satu entri realisasi pada periode berbeda.

- Data Realization Report yang berstatus Submitted tidak dapat diubah oleh Subsidiary PIC hingga proses evaluasi selesai, kecuali dokumen dikembalikan dengan status Rejected.

**Acceptance Criteria**

- AC-109: Given Sustainability Subsidiary PIC membuka halaman Report Plan Realization untuk item Action Plan yang berstatus Take, then sistem merender komponen input sesuai konfigurasi Input Type Action Indicator dari MKI.

- AC-110: Given Action Indicator memiliki Evidence \= 'Required' dan Subsidiary PIC belum mengunggah file, then tombol Submit pada Realization Report tetap terkunci.

- AC-111: Given Realization Report berhasil di-Submit, then status berubah menjadi Submitted dan form terkunci read-only hingga proses evaluasi Holding selesai.

- AC-1112: Given Realization Report dikembalikan dengan status Rejected, then Subsidiary PIC dapat membuka kembali form, memperbaiki data sesuai Reviewer Notes, dan melakukan resubmit.

- AC-113: Given Realization Report dari Initiate New Plan SDG Non-Adopted (setelah item Approved dan Active) dikirimkan, then report tersebut masuk ke antrian Review & Approval Holding normal konsisten dengan Business Rule bahwa semua Realization Report wajib diapprove.

**Mockup / Screen Reference**

_**\[Insert Mockup Here \- Manual Input\]**_

## **Dependencies — Module 2: Sustainability Reporting Portal**

- GRI Management bergantung pada ketersediaan MKI (Module 1\) sebagai sumber lookup indikator GRI\_QUANT dan GRI\_QUAL.

- SDG Framework bergantung pada SDG Adoption Management untuk menentukan SDG mana yang dapat dijadikan Parent Action Plan Matrix.

- Strategic Insight Dashboard hanya menampilkan data dari submission yang telah diproses melalui Review & Approval.

- GRI Submission (Quantitative & Qualitative) bergantung pada Rilis GRI aktif yang sudah dipublikasikan oleh Holding.

- SDG Action Plan Management (Take/Skip) bergantung pada SDG Framework yang sudah dipublikasikan oleh Holding.

- Initiate New Plan bergantung pada SDG Adoption Management untuk menentukan governance jalur Adopted (auto-Active) vs Non-Adopted (wajib approval).

- Report Plan Realization bergantung pada MKI (Module 1\) untuk rendering formulir dinamis dan konfigurasi Evidence.

- Seluruh submission bergantung pada Workflow Configuration (Module 1\) untuk routing approval, kecuali Initiate New Plan SDG Adopted di level Action Plan (auto-Active tanpa routing).


<!-- image refs -->
[image41]: images/image41.png
[image42]: images/image42.png
[image43]: images/image43.png
[image44]: images/image44.png
[image45]: images/image45.png
[image46]: images/image46.png
[image47]: images/image47.png
[image48]: images/image48.png
[image49]: images/image49.png
[image50]: images/image50.png
[image51]: images/image51.png
[image52]: images/image52.png
[image53]: images/image53.png
[image54]: images/image54.png
[image55]: images/image55.png
[image56]: images/image56.png
[image57]: images/image57.png
[image58]: images/image58.png
[image59]: images/image59.png
[image60]: images/image60.png
[image61]: images/image61.png
[image62]: images/image62.png
[image63]: images/image63.png
[image64]: images/image64.png
[image65]: images/image65.png
