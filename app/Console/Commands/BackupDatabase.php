<?php

namespace App\Console\Commands;

use App\Services\GoogleDriveService;
use Illuminate\Console\Command;


class BackupDatabase extends Command
{
    protected $signature = 'db:backup';

    protected $description = 'Backup database ke storage Laravel';

    public function handle()
    {
        $backupDir = storage_path('app/backup');

        // Buat folder backup jika belum tersedia
        if (!is_dir($backupDir)) {
            mkdir($backupDir, 0755, true);
        }

        $filename = 'koperasi_' . now()->format('Ymd_His') . '.sql';
        $path = $backupDir . DIRECTORY_SEPARATOR . $filename;

        $mysqldump = 'C:\\laragon\\bin\\mysql\\mysql-8.0.30-winx64\\bin\\mysqldump.exe';

        $host = env('DB_HOST');
        $port = env('DB_PORT', 3306);
        $username = env('DB_USERNAME');
        $password = env('DB_PASSWORD');
        $database = env('DB_DATABASE');

        $passwordOption = $password !== ''
            ? '-p' . escapeshellarg($password)
            : '';

        $command = sprintf(
            '"%s" -h%s -P%s -u%s %s %s > "%s" 2>&1',
            $mysqldump,
            escapeshellarg($host),
            escapeshellarg($port),
            escapeshellarg($username),
            $passwordOption,
            escapeshellarg($database),
            $path
        );

        exec($command, $output, $resultCode);

        if (
            $resultCode !== 0 ||
            !file_exists($path) ||
            filesize($path) === 0
        ) {
            if (file_exists($path)) {
                unlink($path);
            }

            $this->error('Backup database gagal.');

            return Command::FAILURE;
        }

        $this->info('Backup database berhasil!');
        $this->info('File: ' . $path);

        return Command::SUCCESS;
    }
}



// class BackupDatabase extends Command
// {
//     /**
//      * Execute the console command.
//      */
//     protected $signature = 'db:backup';
//     protected $description = 'Backup database dan upload ke Google Drive';

//     public function handle()
//     {
//         $backupDir = storage_path('app/backup');

//         if (!is_dir($backupDir)) {
//             mkdir($backupDir, 0777, true);
//         }

//         $filename = 'backup_' . now()->format('Ymd_His') . '.sql';
//         $path = $backupDir . DIRECTORY_SEPARATOR . $filename;

//         $mysqldump = 'C:\\laragon\\bin\\mysql\\mysql-8.0.30-winx64\\bin\\mysqldump.exe';

//         $password = env('DB_PASSWORD');

//         $passwordOption = $password !== ''
//             ? '-p"' . $password . '"'
//             : '';

//         $command = sprintf(
//             '"%s" -h%s -u%s %s %s > "%s"',
//             $mysqldump,
//             env('DB_HOST'),
//             env('DB_USERNAME'),
//             $passwordOption,
//             env('DB_DATABASE'),
//             $path
//         );

//         exec($command, $output, $resultCode);

//         if ($resultCode !== 0 || !file_exists($path)) {
//             $this->error('Backup database gagal.');
//             return Command::FAILURE;
//         }

//         try {

//             $drive = new GoogleDriveService();
//             $drive->upload($path, $filename, 7, 'backup_');

//             unlink($path);

//             $this->info('Backup berhasil diupload ke Google Drive.');

//             return Command::SUCCESS;
//         } catch (\Exception $e) {

//             $this->error($e->getMessage());

//             return Command::FAILURE;
//         }
//     }
// }
