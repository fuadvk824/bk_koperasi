<?php

namespace App\Services;


use Carbon\Carbon;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\ImageManager;

class ImageUploadService
{

    public function upload($file, string $nameFile, string $codeFolder, string $indukFolder, ?string $oldPath = null): string
    {
        $now = Carbon::now();

        $folder = strtolower($now->format('M') . $now->format('Y'));
        $folderOld = $folder . 'old';

        $newFolderPath = $indukFolder . '/' . $folder . '/' . $codeFolder;
        $oldFolderPath = $indukFolder . '/' . $folderOld . '/' . $codeFolder;

        if ($oldPath && Storage::disk('public')->exists($oldPath)) {
            $oldFileName = basename($oldPath);
            Storage::disk('public')->makeDirectory($oldFolderPath);
            Storage::disk('public')->move($oldPath, $oldFolderPath . '/' . $oldFileName);
        }

        $random = Str::random(6);
        $dateString = $now->format('Ymd');

        Storage::disk('public')->makeDirectory($newFolderPath);

        // Jika PDF, simpan file asli tanpa konversi.
        if ($file->getMimeType() === 'application/pdf') {
            $filename = strtolower($nameFile . $dateString . $random . '.pdf');

            Storage::disk('public')->putFileAs(
                $newFolderPath,
                $file,
                $filename
            );

            return $newFolderPath . '/' . $filename;
        }

        // Jika gambar, pertahankan proses WebP seperti sebelumnya.
        $manager = new ImageManager(new Driver());
        $image = $manager->read($file);

        $image->scaleDown(width: 1200);

        $filename = strtolower($nameFile . $dateString . $random . '.webp');

        $encoded = $image->toWebp(80);

        Storage::disk('public')->put(
            $newFolderPath . '/' . $filename,
            (string) $encoded
        );

        return $newFolderPath . '/' . $filename;
    }

    // public function upload($file, string $nameFile, string $codeFolder, string $indukFolder, ?string $oldPath = null): string
    // {
    //     $now = Carbon::now();

    //     $folder = strtolower($now->format('M') . $now->format('Y'));
    //     $folderOld = $folder . 'old';

    //     $newFolderPath = $indukFolder . '/' . $folder . '/' . $codeFolder;
    //     $oldFolderPath = $indukFolder . '/' . $folderOld . '/' . $codeFolder;

    //     if ($oldPath && Storage::disk('public')->exists($oldPath)) {
    //         $oldFileName = basename($oldPath);
    //         Storage::disk('public')->makeDirectory($oldFolderPath);
    //         Storage::disk('public')->move($oldPath, $oldFolderPath . '/' . $oldFileName);
    //     }

    //     $manager = new ImageManager(new Driver());
    //     $image = $manager->read($file);

    //     $image->scaleDown(width: 1200);

    //     $random = Str::random(6);
    //     $dateString = $now->format('Ymd');

    //     $filename = strtolower($nameFile . $dateString . $random . '.webp');

    //     $encoded = $image->toWebp(80);

    //     Storage::disk('public')->makeDirectory($newFolderPath);
    //     Storage::disk('public')->put($newFolderPath . '/' . $filename, (string) $encoded);

    //     return $newFolderPath . '/' . $filename;
    // }
}
