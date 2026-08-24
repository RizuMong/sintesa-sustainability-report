# **MODULE 1: PLATFORM ADMINISTRATOR**

Modul Platform Administrator adalah fondasi sistem yang menyediakan semua konfigurasi data master, pembangunan instrumen pelaporan dinamis (MKI), tata kelola hak akses, alur persetujuan, dan penjadwalan notifikasi. Seluruh modul lain bergantung pada konfigurasi yang dilakukan di sini.

## **1.1 Master Unit**

**Explanations**

Master Unit menyimpan seluruh satuan pengukuran yang digunakan sebagai referensi indikator kuantitatif ESG. Satuan ini dipanggil sebagai lookup saat Administrator membuat Master Key Indicator bertipe GRI\_QUANT atau SDG\_ACTION.

**Business Rules**

- Setiap Unit wajib memiliki Nama Unit, Simbol/Abstraksi (unik, unique constraint), dan Kategori (Energy, Emissions, Water, Waste, Headcount, Currency, Other).

- Simbol bersifat unik dalam sistem untuk menghindari duplikasi terminologi pengukuran.

- Unit yang telah digunakan pada MKI aktif tidak dapat dihapus permanen; hanya dapat dinonaktifkan.

**Acceptance Criteria**

- AC-01: Given Administrator mengisi Nama Unit, Simbol unik, dan Kategori valid lalu menyimpan, then sistem menyimpan unit baru dan unit tersedia sebagai lookup pada MKI.

- AC-02: Given Simbol yang diinput telah digunakan unit lain, then sistem menampilkan validasi duplikasi dan menolak penyimpanan.

- AC-03: Given suatu Unit telah digunakan pada MKI aktif, then sistem menolak penghapusan permanen dan hanya mengizinkan status dinonaktifkan.

**Mockup / Screen Reference**

_**![][image4]**_

_**![][image5]**_

_**![][image6]**_

## **1.2 Master Pillar & Master Period**

**Explanations**  
Master Pillar menyimpan daftar area strategis (mis. Environment, Social, Governance, atau kategori internal lain seperti Policies) yang digunakan sebagai lookup Pillar Area pada Action Plan Matrix (2.3). Master Period menyimpan tahun buku pelaporan (mis. 2026\) yang menjadi konteks periode aktif bagi seluruh modul submission dan rilis template.

**Business Rules**

- Master Pillar: atribut Code (unik) dan Name. Digunakan sebagai lookup pada field Pillar Area di Action Plan Matrix.

- Master Period: atribut Year (unik, numerik) dan Status (Active/Inactive). Hanya satu Period yang dapat berstatus Active pada satu waktu sebagai periode pelaporan berjalan.

- Master Period juga memiliki atribut Realization Window (Open/Closed), dikonfigurasi terpisah dari Status Active/Inactive Period. Realization Window menentukan apakah pengisian Report Plan Realization untuk periode tersebut diizinkan; Administrator membuka (Open) window ini pada awal siklus pelaporan realisasi dan menutupnya (Closed) setelah siklus berakhir.

- Period dan Pillar yang telah digunakan pada data transaksi aktif (GRI Submission, Action Plan Matrix) tidak dapat dihapus permanen; hanya dapat dinonaktifkan.

**Acceptance Criteria**

- AC-04: Given Administrator mengubah Realization Window suatu Master Period menjadi Closed, then seluruh form Report Plan Realization pada periode tersebut menjadi tidak dapat disubmit oleh Subsidiary PIC, dengan pesan bahwa jendela pelaporan realisasi belum/tidak dibuka.

- AC-05: Given Administrator mencoba menghapus Master Pillar yang sudah digunakan pada Action Plan Matrix aktif, then sistem menolak penghapusan dan hanya mengizinkan status dinonaktifkan.

**Mockup / Screen Reference**

_**![][image7]**_

_**![][image8]**_

_**![][image9]**_

_**![][image10]**_

_**![][image11]**_

_**![][image12]**_

## **1.3 Master Entity (Hierarki Organisasi Self-Referencing)**

**Explanations**

Master Entity mengelola struktur korporasi Sintesa Group menggunakan relasi self-referencing FK, mendukung hierarki tak terbatas: Holding → Sub-holding → Subsidiary → Business Unit → Branch.

**Business Rules**

- Atribut: Entity ID (PK), Parent Entity ID (FK self-referencing, nullable), Nama Entitas, Tipe (Subsidiary / Business Unit / Branch), Alamat, Status (Active/Inactive).

- Jika Tipe \= 'Business Unit' atau 'Branch', user wajib memilih Parent Entity dari daftar entitas yang valid dan aktif. Jika Tipe \= 'Subsidiary', Parent Entity ID dapat bernilai NULL (langsung menginduk ke Holding).

- Entitas yang telah memiliki data pelaporan aktif (GRI Submission, Action Plan) tidak dapat dihapus permanen; hanya dapat dinonaktifkan.

- Entitas yang dinonaktifkan tidak dapat menjadi Parent Entity bagi entitas baru.

**Acceptance Criteria**

- AC-06: Given Administrator memilih Tipe 'Subsidiary' dan mengisi Nama Entitas lalu menyimpan, then sistem menyimpan entitas baru dengan Parent Entity ID \= NULL.

- AC-07: Given Administrator memilih Tipe 'Branch' dan tidak memilih Parent Entity, then sistem menampilkan validasi bahwa Parent Entity wajib dipilih dan menolak penyimpanan.

- AC-08: Given Administrator mencoba memilih entitas berstatus Inactive sebagai Parent, then sistem tidak menampilkan entitas tersebut dalam daftar pilihan Parent.

- AC-09: Given suatu entitas memiliki data pelaporan aktif, then sistem menolak penghapusan permanen dan hanya mengizinkan perubahan status menjadi Inactive.

**Mockup / Screen Reference**

_**![][image13]**_

_**![][image14]**_

_**![][image15]**_

## **1.4 Master Global Reporting Initiative (GRI)**

**Explanations**

Master GRI menyimpan katalog kode dan judul resmi GRI Disclosure sesuai GRI Standards (contoh: 302-1, 305-4, 401-1, 306\) sebagai satu-satunya sumber kebenaran (single source of truth) untuk kode GRI di seluruh sistem. Sebelumnya, field GRI Code pada MKI GRI-Qualitative dan MKI GRI-Quantitative bersifat free text yang diketik bebas oleh Administrator, sehingga rawan duplikasi penamaan, ketidakkonsistenan format, dan tidak ada validasi terhadap standar resmi GRI. Dengan Master GRI, kedua MKI tersebut — dan fitur lain di masa depan yang memerlukan referensi GRI — memilih kode melalui lookup/dropdown ke tabel ini, bukan lagi mengetik manual.

**Business Rules**

- Field: ids (PK), gri\_code (Text, unik, format resmi sesuai GRI Standards — contoh: "302-1", "305-4", "401-1"), gri\_series (Dropdown: Universal / Economic / Environmental / Social — mengikuti kategorisasi resmi GRI Standards), disclosure\_title (judul resmi disclosure, contoh: "Energy consumption within the organization"), status ENUM('Active','Inactive').

- gri\_code bersifat unik dalam sistem; sistem menolak penyimpanan apabila kode yang diinput sudah terdaftar.

- Master GRI yang telah direferensikan oleh MKI berstatus aktif tidak dapat dihapus permanen; hanya dapat dinonaktifkan (status Inactive).

- Kode berstatus Inactive tidak lagi tampil sebagai opsi lookup pada pembuatan MKI baru, namun tetap dipertahankan pada MKI yang sudah ada agar data historis tidak rusak.

- Field code pada MKI GRI-Qualitative (section 1.3.1) dan MKI GRI-Quantitative (section 1.3.2) yang sebelumnya berupa Text Input bebas kini digantikan Dropdown Lookup ke Master GRI ini — lihat revisi Business Rules terkait di bawah.

**Acceptance Criteria**

- AC-7: Given Administrator mengisi gri\_code yang unik, gri\_series dan disclosure\_title lalu menyimpan, then Master GRI baru tersimpan dan tersedia sebagai lookup sesuai tipenya.

- AC-8: Given gri\_code yang diinput sudah terdaftar sebelumnya, then sistem menampilkan validasi duplikasi dan menolak penyimpanan.

- AC-9: Given suatu kode Master GRI telah direferensikan oleh MKI berstatus aktif, then sistem menolak penghapusan permanen dan hanya mengizinkan perubahan status menjadi Inactive.

- AC-10: Given suatu kode Master GRI berstatus Inactive, then kode tersebut tidak tampil sebagai opsi lookup saat Administrator membuat MKI baru, namun tetap tampil pada MKI yang sudah ada.

**Mockup / Screen Reference**

**![][image16]![][image17]**

## **1.5 User Management — Position & Employee**

**Explanations**

Grup menu User Management terdiri dari Master Position, Master Employee, dan Access Management. Master Position mengelola daftar domain dan peran jabatan (mis. domain "Ekonomi/HR/Sustainability", role "PIC"/"Executive") yang menjadi lookup saat mendaftarkan Employee. Master Employee mengelola seluruh akun pengguna sistem beserta penugasan entitas dan posisi. Setiap pengguna terhubung ke satu Entity dan satu Position melalui foreign key.

**Business Rules**

- Master Position — Atribut: Position ID (PK), Domain (mis. Ekonomi, HR, Sustainability), Role (mis. PIC, Executive), Entity ID (FK Master Entity, nullable untuk Position generik lintas entitas), Name (label gabungan, mis. "PIC Ekonomi \- MPP").

- Master Employee — Atribut: User ID (PK), Entity ID (FK Master Entity), Position ID (FK Master Position), Nama Lengkap, Email Korporat (unik, format email valid), Nomor Telepon, Status Aktif.

- Email harus unik dan memenuhi format email valid. Akun dengan status Inactive tidak dapat melakukan login ke dalam sistem.

**Acceptance Criteria**

- AC-11: Given Administrator mengisi Nama, Email unik valid, dan minimal satu Entity Assignment lalu menyimpan, then sistem menyimpan akun dan employee dapat login.

- AC-12: Given Email yang diinput telah digunakan employee lain, then sistem menampilkan validasi duplikasi dan menolak penyimpanan.

- AC-13: Given employee dengan status Inactive mencoba login, then sistem menolak akses dan menampilkan pesan bahwa akun tidak aktif.

- AC-14: Given Administrator menonaktifkan (Inactive) suatu employee, then employee tersebut kehilangan akses login pada sesi berikutnya.

**Mockup / Screen Reference**

_**![][image18]![][image19]![][image20]**_

_**![][image21]**_

_**![][image22]**_

_**![][image23]**_

## **1.6 Access Management**

**Explanations**

Fitur ini memetakan setiap Position terhadap kombinasi App (Modul) dan Page (Menu) yang dapat diakses.

**Business Rules**

- Konfigurasi hak akses hanya dapat diterapkan pada tingkat visibilitas App dan Page.

- Perubahan konfigurasi akses berlaku pada sesi login berikutnya bagi seluruh pengguna dengan Position tersebut.

**Acceptance Criteria**

- AC-15: Given Administrator mencentang kombinasi App dan Page untuk suatu Position lalu menyimpan, then pengguna dengan Position tersebut dapat melihat App dan Page yang diberikan pada navigasi sistem.

- AC-16: Given suatu Page tidak dicantumkan untuk Position tertentu, then pengguna dengan Role tersebut tidak dapat melihat atau mengakses menu terkait meskipun mencoba akses langsung via URL.

- AC-17: Given Administrator mengubah konfigurasi akses suatu Position, then perubahan berlaku bagi seluruh pengguna aktif dengan Position tersebut pada sesi login berikutnya.

**Mockup / Screen Reference**

_**![][image24]**_

_**![][image25]**_

_**![][image26]**_

## **1.7 Master Key Indicator (MKI) — Core Dynamic Form Builder**

**Explanations**

MKI adalah komponen paling kritis dalam arsitektur sistem karena berfungsi sebagai Dynamic Form Builder yang menentukan struktur seluruh formulir pelaporan secara terpusat tanpa perubahan kode. Setiap indikator yang didefinisikan di sini menjadi building block yang dipanggil oleh Holding saat menyusun template GRI maupun SDG Action Plan Matrix.

MKI memiliki tiga tipe klasifikasi (Indicator Type): GRI\_QUANT untuk indikator kuantitatif GRI (termasuk semua eks-HR Metrics), GRI\_QUAL untuk indikator kualitatif GRI berbasis nested Q\&A, dan SDG\_ACTION untuk indikator yang digunakan sebagai Action Indicator pada SDG Action Plan Matrix. Tipe ini menentukan modul mana saja yang dapat menggunakan indikator tersebut sebagai lookup.

**Field Requirement**

| Field               | Tipe / Komponen UI               | Validasi & Aturan                                                                                                    |
| :------------------ | :------------------------------- | :------------------------------------------------------------------------------------------------------------------- |
| Indicator Name      | Text Input                       | Max 255 karakter, Required.                                                                                          |
| Variable Code       | Text Input                       | Unik, Kapital, format SNAKE\_CASE. Digunakan untuk kebutuhan komputasi/formula backend.                              |
| Indicator Type      | Dropdown Select                  | Pilihan: GRI\_QUANT                                                                                                  | GRI\_QUAL                                                                                       | SDG\_ACTION. Menentukan klasifikasi dan modul penggunaan. |
| Unit                | Dropdown Select (FK Master Unit) | Conditional Required: wajib diisi jika Indicator Type \= GRI\_QUANT atau SDG\_ACTION. Tidak relevan untuk GRI\_QUAL. |
| Input Type          | Dropdown Select                  | Pilihan: Number                                                                                                      | Text                                                                                            | Percentage                                                | Boolean. Menentukan komponen input HTML yang dirender di Subsidiary Portal. |
| Evidence Attachment | Dropdown Select                  | Pilihan: Optional                                                                                                    | Required. Menentukan apakah pengunggahan file bukti fisik (pdf/jpg) diwajibkan saat submission. |

**Business Rules**

- Variable Code bersifat unik global dan wajib menggunakan format SNAKE\_CASE huruf kapital (e.g., KONSUMSI\_LISTRIK\_OPS).

- Field Unit wajib diisi jika Indicator Type \= GRI\_QUANT atau SDG\_ACTION; tidak relevan dan tidak ditampilkan untuk GRI\_QUAL.

- Indikator yang telah digunakan pada template GRI yang dipublikasikan atau Action Plan Matrix yang diterbitkan tidak dapat diubah Input Type-nya atau dihapus, guna menjaga konsistensi data historis.

- GRI\_QUAL tidak menggunakan Unit dan Input Type dalam konteks formulir submission — rendering GRI\_QUAL diatur via nested Q\&A schema terpisah pada GRI Master.

**Acceptance Criteria**

- AC-18: Given Administrator mengisi Indicator Name, Variable Code SNAKE\_CASE unik, Indicator Type, Input Type, dan Evidence lalu menyimpan, then sistem menyimpan indikator dan tersedia sebagai lookup di GRI Master dan SDG Framework sesuai tipenya.

- AC-19: Given Variable Code yang diinput telah digunakan indikator lain, then sistem menampilkan validasi duplikasi dan menolak penyimpanan.

- AC-20: Given Administrator memilih Indicator Type \= GRI\_QUANT atau SDG\_ACTION dan tidak mengisi Unit, then sistem menampilkan validasi Unit wajib diisi dan menolak penyimpanan.

- AC-21: Given Administrator memilih Indicator Type \= GRI\_QUAL, then sistem tidak menampilkan field Unit sehingga tidak dapat diisi.

- AC-22: Given indikator dengan Input Type \= 'Number' digunakan pada formulir Subsidiary, then sistem merender komponen input numerik yang hanya menerima angka desimal atau bulat dan menolak huruf alfabet dan simbol.

- AC-23: Given indikator dengan Input Type \= 'Percentage' digunakan pada formulir Subsidiary, then sistem merender input numerik dengan append simbol % dan memvalidasi bahwa nilai berada dalam rentang 0 hingga 100\.

- AC-24: Given indikator dengan Input Type \= 'Boolean' digunakan pada formulir Subsidiary, then sistem merender Toggle Switch dengan pilihan mutlak Ya (True) atau Tidak (False).

- AC-25: Given indikator dengan Evidence \= 'Required' digunakan pada formulir Subsidiary, then sistem menolak Submit hingga file dengan ekstensi pdf atau jpg berhasil diunggah oleh pengguna.

- AC-26: Given indikator yang telah digunakan pada template GRI Published, then sistem mencegah perubahan Input Type dan penghapusan indikator tersebut.

**Mockup / Screen Reference**

_Master Key Indicator \- GRI: Qualitative_

_**![][image27]**_

_Master Key Indicator \- GRI: Quantitative_

_**![][image28]**_

_**![][image29]**_

_Sustainability Development Goals \- Indicator_

_**![][image30]**_

_**![][image31]**_

## **1.8 MKI \- SDG: Indikator Buatan Subsidiary (Governed Scope)**

**Explanations**  
Fitur Initiate New Plan memungkinkan Subsidiary menyusun Action Plan mandiri di luar SDG Framework Holding. Untuk mendukung ini, Sustainability Subsidiary PIC diberikan akses terbatas (scoped) pada Master Key Indicator \- SDG guna membuat Action Indicator baru apabila indikator yang relevan belum tersedia pada MKI \- SDG global yang dikelola Administrator/Holding. Akses ini bersifat Create Only dan terbatas pada scope entitas pembuat — bukan akses CRUD penuh sebagaimana dimiliki Platform Administrator.  
**Business Rules**

- Sustainability Subsidiary PIC diberikan akses Create Only (Scoped) pada MKI \- SDG, khusus untuk membuat Action Indicator baru yang HANYA dapat digunakan pada Initiate New Plan miliknya sendiri.

- Indikator SDG buatan Subsidiary otomatis diberi flag created\_by\_level \= 'Subsidiary' dan Origin\_Entity\_ID; indikator ini tidak tampil sebagai opsi lookup pada SDG Framework resmi yang disusun PIC SR Holding, maupun pada Initiate New Plan milik Subsidiary lain.

- PIC SR Holding dan Platform Administrator memiliki visibilitas Read Only atas seluruh indikator SDG buatan Subsidiary melalui MKI \- SDG, untuk kebutuhan audit dan potensi promosi indikator menjadi indikator global resmi pada rilis SDG Framework berikutnya.

- Subsidiary PIC tidak dapat mengubah (Update) atau menghapus (Delete) indikator SDG yang sudah digunakan pada Initiate New Plan berstatus Active/Approved, guna menjaga konsistensi data historis realisasi.

**Acceptance Criteria**

- AC-27: Given Sustainability Subsidiary PIC membuat Action Indicator baru pada MKI \- SDG saat menyusun Initiate New Plan, then indikator tersimpan dengan created\_by\_level \= 'Subsidiary' dan Origin\_Entity\_ID sesuai entitas pembuat.

- AC-28: Given indikator SDG dibuat oleh Subsidiary A, then indikator tersebut tidak muncul pada lookup Action Indicator saat Subsidiary B membuat Initiate New Plan, maupun saat PIC SR Holding menyusun SDG Framework resmi.

- AC-29: Given PIC SR Holding membuka MKI \- SDG, then seluruh indikator buatan Subsidiary (created\_by\_level \= 'Subsidiary') tampil dengan informasi entitas pembuatnya.

**Mockup / Screen Reference**

_**![][image30]**_

_**![][image31]**_

## **1.9 Workflow Configuration (Approval Line — Entity-Scoped Routing)**

**Explanations**

Fitur ini mengonfigurasi rantai persetujuan (Approval Line) dokumen secara dinamis per entitas dan per tipe submission. Sistem mendukung konfigurasi multi-level sequential: dokumen tidak dapat diteruskan ke approver berikutnya sebelum disetujui approver sebelumnya. Setiap level pada Approval Line memiliki atribut approval\_type yang menentukan siapa yang bertindak sebagai approver pada level tersebut — memungkinkan Subsidiary menjadi approver bagi Branch di bawahnya (lihat 2.4 Entity-Scoped Approval Routing).

**Business Rules**

- Atribut: ID Workflow (PK), Workflow Name (hardcoded: GRI\_QUANTITATIVE | GRI\_QUALITATIVE | SDG\_ACTION\_PLAN | SDG\_REALIZATION), Entity ID (FK Master Entity), Status (Active/Inactive), Approval Line (array approval\_lines, tiap elemen berisi approval\_type dan employee\_ids).

- Setiap Entity hanya dapat memiliki satu Workflow berstatus Active untuk setiap Workflow Name; mencegah ambiguitas routing.

- Jika approver pada suatu level menolak (Reject), submission dikembalikan ke Subsidiary PIC dengan status Rejected; kolom Reviewer Notes wajib diisi oleh approver yang menolak.

- approval\_type pada tiap level Approval Line bernilai 'Holding Approval' (approver \= PIC SR Holding) atau 'By PIC' (approver \= PIC pada entitas Parent pengirim, mis. PIC Subsidiary sebagai approver Branch-nya sendiri). Untuk Entity bertipe Branch, level pertama default menggunakan approval\_type \= 'By PIC' merujuk ke Subsidiary induk (parent\_entity\_id); untuk Entity bertipe Subsidiary tanpa Branch, level pertama default menggunakan approval\_type \= 'Holding Approval'.

- Setelah Subsidiary melakukan resubmission atas dokumen Rejected, alur approval kembali ke level pertama.

**Acceptance Criteria**

- AC-30: Given Administrator mengkonfigurasi Workflow dengan Approval Line dua level untuk Entity A dan tipe GRI\_QUANTITATIVE, then submission GRI Quantitative dari Entity A pertama kali diteruskan ke Approver Level 1 sebelum dapat ditinjau oleh Approver Level 2\.

- AC-31: Given Administrator mencoba membuat Workflow kedua berstatus Active untuk entitas dan tipe yang sama, then sistem menampilkan validasi konflik dan menolak konfigurasi.

- AC-32: Given Approver Level 1 menolak (Reject) suatu submission tanpa mengisi Reviewer Notes, then sistem menampilkan validasi bahwa Reviewer Notes wajib diisi dan menolak eksekusi keputusan.

- AC-33: Given Workflow Configuration Entity bertipe Branch memiliki Approval Line Level 1 dengan approval\_type \= 'By PIC', then submission dari Branch tersebut diteruskan ke PIC Subsidiary induknya (parent\_entity\_id), bukan langsung ke PIC SR Holding.

- AC-34: Given Subsidiary melakukan resubmission atas dokumen berstatus Rejected, then dokumen kembali masuk ke antrean Approver Level 1 sesuai Workflow Configuration yang berlaku.

**Mockup / Screen Reference**

_**![][image32]**_

_**![][image33]**_

_**![][image34]**_

## **1.10 Periodic Notification (Automated Scheduler)**

**Explanations**

Sistem penjadwalan otomatis berbasis Cron Job yang mengirimkan pengingat kepada Sustainability Subsidiary PIC agar pengisian data dilakukan tepat waktu. Background service mengecek tabel konfigurasi setiap hari dan mengeksekusi pengiriman notifikasi via Email.

**Business Rules**

- Atribut Konfigurasi: ID Notification (PK), Judul Pengingat, Bulan Batas Waktu (1-12), Hari Batas Waktu (1-31), Pengingat H-Sebelumnya (jumlah hari sebelum deadline), Jenis Notifikasi (Action Plan | Realization Report | GRI Quant | GRI Qual), Status (Active/Inactive).

- Notifikasi otomatis hanya dikirimkan kepada Sustainability Subsidiary PIC pada entitas yang belum menyelesaikan submission terkait pada saat jadwal pengingat tereksekusi.

- Konfigurasi dengan Status Inactive tidak memicu pengiriman notifikasi meskipun deadline tercapai.

**Acceptance Criteria**

- AC-35: Given Administrator mengonfigurasi notifikasi GRI Quant dengan Pengingat H-7 berstatus Active, then sistem mengirimkan Email kepada seluruh Sustainability Subsidiary PIC yang belum menyelesaikan submission GRI Quantitative tujuh hari sebelum deadline.

- AC-36: Given Subsidiary PIC telah menyelesaikan submission GRI Quantitative dan jadwal pengingat tereksekusi, then sistem tidak mengirimkan notifikasi kepada PIC entitas tersebut.

- AC-37: Given konfigurasi notifikasi berstatus Inactive, then sistem tidak mengeksekusi pengiriman notifikasi apapun meskipun tanggal deadline telah tercapai.

**Mockup / Screen Reference**

_**![][image35]**_

_**![][image36]**_

_**![][image37]**_

## **1.11 Generate Action Plan — Log Generate (Scheduler/Trigger)**

**Explanations**  
Menu ini menampilkan log eksekusi proses background (scheduler/trigger) yang menghasilkan pool instance Action Plan/Realization yang wajib direspons oleh Subsidiary — terpisah dari Periodic Notification (1.7) yang khusus menangani pengiriman pengingat. Log Generate mencatat setiap kali sistem meregenerasi daftar tugas (mis. saat SDG Framework baru dipublikasikan Holding, atau saat siklus periode pelaporan baru dimulai) sehingga Administrator dapat melakukan audit dan troubleshooting distribusi.  
**Business Rules**

- Setiap eksekusi scheduler/trigger dicatat sebagai satu baris log: timestamp eksekusi, jenis trigger (Manual/Scheduled), submission\_type terdampak, jumlah entitas penerima, dan status (Success/Failed).

- Administrator dapat memicu ulang (re-trigger) proses generate secara manual dari halaman ini apabila distribusi otomatis gagal pada suatu entitas.

**Acceptance Criteria**

- AC-38: Given SDG Framework baru dipublikasikan oleh PIC SR Holding, then sistem mencatat satu baris log baru pada Log Generate berisi timestamp, submission\_type \= SDG\_ACTION\_PLAN.

**Mockup / Screen Reference**

_**![][image38]**_

_**![][image39]**_

_**![][image40]**_

## **Dependencies — Module 1: Platform Administrator**

- Master Unit wajib tersedia sebelum MKI dapat dikonfigurasi karena Unit digunakan sebagai lookup.

- Master Entity wajib tersedia sebelum Master Employee dan Workflow Configuration dapat dikonfigurasi.

- MKI wajib tersedia sebelum GRI Master dan SDG Framework dapat disusun oleh Holding.

- Workflow Configuration menentukan alur approval untuk seluruh submission dari Module 3; tanpanya, submission tidak dapat diproses.


<!-- image refs -->
[image4]: images/image4.png
[image5]: images/image5.png
[image6]: images/image6.png
[image7]: images/image7.png
[image8]: images/image8.png
[image9]: images/image9.png
[image10]: images/image10.png
[image11]: images/image11.png
[image12]: images/image12.png
[image13]: images/image13.png
[image14]: images/image14.png
[image15]: images/image15.png
[image16]: images/image16.png
[image17]: images/image17.png
[image18]: images/image18.png
[image19]: images/image19.png
[image20]: images/image20.png
[image21]: images/image21.png
[image22]: images/image22.png
[image23]: images/image23.png
[image24]: images/image24.png
[image25]: images/image25.png
[image26]: images/image26.png
[image27]: images/image27.png
[image28]: images/image28.png
[image29]: images/image29.png
[image30]: images/image30.png
[image31]: images/image31.png
[image32]: images/image32.png
[image33]: images/image33.png
[image34]: images/image34.png
[image35]: images/image35.png
[image36]: images/image36.png
[image37]: images/image37.png
[image38]: images/image38.png
[image39]: images/image39.png
[image40]: images/image40.png
