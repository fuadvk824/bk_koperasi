
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Reset Password Akun Koperasi</title>
</head>

<body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:20px 0;">
        <tr>
            <td align="center">

                <table width="500" cellpadding="0" cellspacing="0"
                    style="background:#ffffff;border-radius:10px;overflow:hidden;">

                    <!-- Header -->
                    <tr>
                        <td align="center" style="padding:24px;background:#2563eb;">
                            <h2 style="margin:0;color:#ffffff;">
                                KOPERASI SEJAHTERA
                            </h2>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding:24px;color:#333;">

                            <h2 style="margin-top:0;color:#111;">
                                Password Akun
                                <span style="color:#2563eb;">Koperasi</span>
                                Anda Telah Direset
                            </h2>

                            <p>
                                Yth. <strong>{{ $user->name }}</strong>,
                            </p>

                            <p style="text-align:justify;">
                                Administrator telah melakukan reset password
                                untuk akun Anda pada aplikasi Koperasi Sejahtera.
                                Silakan gunakan informasi login berikut untuk
                                masuk kembali ke aplikasi.
                            </p>

                            <!-- Account Information -->
                            <table cellpadding="8" cellspacing="0"
                                style="margin:16px 0;background:#f8fafc;width:100%;border-radius:6px;">

                                <tr>
                                    <td><b>Email</b></td>
                                    <td>: {{ $user->email }}</td>
                                </tr>

                                <tr>
                                    <td><b>Password Baru</b></td>
                                    <td>
                                        : <strong style="color:#2563eb;">
                                            {{ $password }}
                                        </strong>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin-top:16px;text-align:justify;">
                                Password akun Anda telah diperbarui oleh administrator koperasi.
                                Silakan simpan informasi login tersebut dengan baik dan gunakan
                                password baru untuk mengakses aplikasi.
                            </p>

                            <!-- APK Download Section -->
                            <table width="100%" cellpadding="0" cellspacing="0"
                                style="margin:24px 0;background:#eff6ff;border-radius:8px;">
                                <tr>
                                    <td align="center" style="padding:20px;">

                                        <h3 style="margin:0 0 10px;color:#1e40af;">
                                            Download Aplikasi Koperasi
                                        </h3>

                                        <p style="font-size:14px;color:#444;line-height:1.6;margin:0 0 18px;">
                                            Nikmati kemudahan mengakses layanan
                                            Koperasi Sejahtera melalui smartphone Android Anda.
                                            Silakan download dan instal aplikasi melalui tombol berikut.
                                        </p>

                                        <a href="https://drive.google.com/drive/folders/1OwvG02GgS447KgYDmLYDoNJr0MThNAXx?usp=drive_link"
                                            style="display:inline-block;background:#2563eb;color:#ffffff;
                                            text-decoration:none;padding:13px 25px;border-radius:6px;
                                            font-weight:bold;font-size:14px;">
                                            DOWNLOAD APLIKASI (APK)
                                        </a>

                                        <p style="font-size:12px;color:#666;margin:15px 0 0;">
                                            Khusus perangkat Android.
                                            Pastikan Anda mengunduh aplikasi dari link resmi koperasi.
                                        </p>

                                    </td>
                                </tr>
                            </table>

                            <p style="text-align:justify;">
                                Apabila Anda mengalami kendala saat login atau merasa tidak mengetahui
                                proses reset password ini, silakan menghubungi administrator koperasi
                                untuk mendapatkan bantuan.
                            </p>

                            <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">

                            <p style="font-size:13px;color:#666;text-align:justify;">
                                Anda menerima email ini karena administrator
                                Koperasi telah melakukan reset password
                                terhadap akun Anda.
                            </p>

                            <p style="margin-top:24px;">
                                Salam,<br>
                                <strong>Administrator Koperasi</strong>
                            </p>

                        </td>
                    </tr>

                </table>

            </td>
        </tr>
    </table>
</body>
</html>
