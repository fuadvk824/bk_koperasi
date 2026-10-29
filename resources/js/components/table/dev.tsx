/*_________________________________________________________
|
| POIN 1
|________________________________________________________*/

// SELECT
//     u.name AS nama,
//     u.active_at,

//     s.tanggal_simpanan AS simpanan,
//     p.tanggal_pinjaman AS pinjaman,
//     tk.tanggal_transaksi_kas AS transaksi_kas,

//     CASE
//         WHEN s.tanggal_simpanan < u.active_at
//           OR p.tanggal_pinjaman < u.active_at
//         THEN 1
//         ELSE 0
//     END AS tandai

// FROM users u

// LEFT JOIN (
//     SELECT
//         user_id,
//         MIN(tanggal) AS tanggal_simpanan
//     FROM simpanan
//     GROUP BY user_id
// ) s ON s.user_id = u.id

// LEFT JOIN (
//     SELECT
//         user_id,
//         MIN(tanggal_pinjaman) AS tanggal_pinjaman
//     FROM pinjaman
//     GROUP BY user_id
// ) p ON p.user_id = u.id


// LEFT JOIN (
//     SELECT
//         user_id,
//         MIN(DATE(tanggal)) AS tanggal_transaksi_kas
//     FROM transaksi_kas
//     WHERE user_id IS NOT NULL
//     GROUP BY user_id
// ) tk ON tk.user_id = u.id

// ORDER BY u.name ASC;


/*_________________________________________________________
|
| POIN 2 active_at nya baru , tapi ada data lama
|________________________________________________________*/

// SELECT
//     u.id,
//     u.name AS nama,
//     u.active_at AS active_at_lama,
//     LEAST(
//         COALESCE(s.tanggal_simpanan, '9999-12-31'),
//         COALESCE(p.tanggal_pinjaman, '9999-12-31'),
//         COALESCE(tk.tanggal_transaksi_kas, '9999-12-31')
//     ) AS active_at_baru
// FROM users u
// LEFT JOIN (
//     SELECT user_id, MIN(tanggal) AS tanggal_simpanan
//     FROM simpanan
//     GROUP BY user_id
// ) s ON s.user_id = u.id
// LEFT JOIN (
//     SELECT user_id, MIN(tanggal_pinjaman) AS tanggal_pinjaman
//     FROM pinjaman
//     GROUP BY user_id
// ) p ON p.user_id = u.id
// LEFT JOIN (
//     SELECT user_id, MIN(DATE(tanggal)) AS tanggal_transaksi_kas
//     FROM transaksi_kas
//     WHERE user_id IS NOT NULL
//     GROUP BY user_id
// ) tk ON tk.user_id = u.id
// WHERE
//     (
//         s.tanggal_simpanan < u.active_at
//         OR p.tanggal_pinjaman < u.active_at
//     )
//     AND LEAST(
//         COALESCE(s.tanggal_simpanan, '9999-12-31'),
//         COALESCE(p.tanggal_pinjaman, '9999-12-31'),
//         COALESCE(tk.tanggal_transaksi_kas, '9999-12-31')
//     ) <> '9999-12-31'
// ORDER BY u.name;


/*_________________________________________________________
|
| POIN 3 memperbaiki tanggal active_at pada tabel users berdasarkan tanggal aktivitas keuangan(simpanan/pinjaman/angsuran/transaksi kas) paling awal milik setiap anggota.

|________________________________________________________*/

// UPDATE users u
// LEFT JOIN (
//     SELECT user_id, MIN(tanggal) AS tanggal_simpanan
//     FROM simpanan
//     GROUP BY user_id
// ) s ON s.user_id = u.id
// LEFT JOIN (
//     SELECT user_id, MIN(tanggal_pinjaman) AS tanggal_pinjaman
//     FROM pinjaman
//     GROUP BY user_id
// ) p ON p.user_id = u.id
// LEFT JOIN (
//     SELECT user_id, MIN(DATE(tanggal)) AS tanggal_transaksi_kas
//     FROM transaksi_kas
//     WHERE user_id IS NOT NULL
//     GROUP BY user_id
// ) tk ON tk.user_id = u.id

// SET u.active_at = LEAST(
//     COALESCE(s.tanggal_simpanan, '9999-12-31'),
//     COALESCE(p.tanggal_pinjaman, '9999-12-31'),
//     COALESCE(tk.tanggal_transaksi_kas, '9999-12-31')
// )

// WHERE
//     (
//         s.tanggal_simpanan < u.active_at
//         OR p.tanggal_pinjaman < u.active_at
//     )
//     AND LEAST(
//         COALESCE(s.tanggal_simpanan, '9999-12-31'),
//         COALESCE(p.tanggal_pinjaman, '9999-12-31'),
//         COALESCE(tk.tanggal_transaksi_kas, '9999-12-31')
//     ) <> '9999-12-31';


/*_________________________________________________________
|
| POIN 4 merubah tanggal active_at user agar sama dengan tanggal awal simpananya 
|________________________________________________________*/

// UPDATE users u
// JOIN (
//     SELECT
//         user_id,
//         MIN(tanggal) AS tanggal_awal
//     FROM simpanan
//     GROUP BY user_id
// ) s ON s.user_id = u.id
// SET u.active_at = s.tanggal_awal
// WHERE u.active_at IS NULL
//    OR u.active_at <> s.tanggal_awal;


/*_________________________________________________________
|
| POIN 5 cek tanggal_bayar(angsuran) yg bulan tahun nya beda sama kolom bulan , tahun
|________________________________________________________*/

// SELECT
//     a.id AS id_angsuran,
//     u.name AS nama_user,
//     a.bulan,
//     a.tahun,
//     a.tanggal_bayar AS tanggal_bayar_lama,
//     DATE_ADD(
//         DATE_ADD(
//             MAKEDATE(a.tahun, 1),
//             INTERVAL (a.bulan - 1) MONTH
//         ),
//         INTERVAL (DAY(a.tanggal_bayar) - 1) DAY
//     ) AS tanggal_bayar_baru,

//     tk.id AS id_transaksi_kas,
//     tk.tanggal AS tanggal_kas_lama,
//     CONCAT(
//         a.tahun, '-',
//         LPAD(a.bulan, 2, '0'), '-',
//         LPAD(DAY(tk.tanggal), 2, '0'), ' ',
//         TIME(tk.tanggal)
//     ) AS tanggal_kas_baru

// FROM angsuran AS a
// JOIN users AS u
//     ON u.id = a.user_id
// LEFT JOIN transaksi_kas AS tk
//     ON tk.ref_id = a.id
//     AND tk.kategori = 'angsuran'
//     AND tk.jenis = 'masuk'
//     AND tk.status = 'berhasil'

// WHERE a.status = 'sudah_bayar'
//     AND a.tanggal_bayar IS NOT NULL
//     AND (
//         MONTH(a.tanggal_bayar) <> a.bulan
//         OR YEAR(a.tanggal_bayar) <> a.tahun
//     )
// ORDER BY a.tanggal_bayar DESC, a.id DESC;



/*_________________________________________________________
|
| POIN 6 update dari poin 5  , penyelesaian
|________________________________________________________*/
// UPDATE angsuran AS a
// SET a.tanggal_bayar = DATE_ADD(
//     DATE_ADD(
//         MAKEDATE(a.tahun, 1),
//         INTERVAL (a.bulan - 1) MONTH
//     ),
//     INTERVAL (
//         LEAST(
//             DAY(a.tanggal_bayar),
//             DAY(
//                 LAST_DAY(
//                     DATE_ADD(
//                         MAKEDATE(a.tahun, 1),
//                         INTERVAL (a.bulan - 1) MONTH
//                     )
//                 )
//             )
//         ) - 1
//     ) DAY
// )
// WHERE a.status = 'sudah_bayar'
//     AND a.tanggal_bayar IS NOT NULL
//     AND (
//         MONTH(a.tanggal_bayar) <> a.bulan
//         OR YEAR(a.tanggal_bayar) <> a.tahun
//     );

// -- 2. Perbaiki tanggal pada transaksi kas terkait
// UPDATE transaksi_kas AS tk
// JOIN angsuran AS a
//     ON tk.ref_id = a.id
// SET tk.tanggal = TIMESTAMP(
//     DATE_ADD(
//         DATE_ADD(
//             MAKEDATE(a.tahun, 1),
//             INTERVAL (a.bulan - 1) MONTH
//         ),
//         INTERVAL (
//             LEAST(
//                 DAY(tk.tanggal),
//                 DAY(
//                     LAST_DAY(
//                         DATE_ADD(
//                             MAKEDATE(a.tahun, 1),
//                             INTERVAL (a.bulan - 1) MONTH
//                         )
//                     )
//                 )
//             ) - 1
//         ) DAY
//     ),
//     TIME(tk.tanggal)
// )
// WHERE tk.kategori = 'angsuran'
//     AND tk.jenis = 'masuk'
//     AND tk.status = 'berhasil'
//     AND a.status = 'sudah_bayar'
//     AND a.tanggal_bayar IS NOT NULL
//     AND (
//         MONTH(tk.tanggal) <> a.bulan
//         OR YEAR(tk.tanggal) <> a.tahun
//     );
 
 