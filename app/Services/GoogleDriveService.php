<?php

namespace App\Services;

use Google\Client;
use Google\Service\Drive;
use Google\Service\Drive\DriveFile;

class GoogleDriveService
{
    protected Drive $service;

    public function __construct()
    {
        $client = new Client();

        $client->setAuthConfig(base_path(env('GOOGLE_DRIVE_CREDENTIALS')));
        // $client->addScope(Drive::DRIVE);
        $client->setScopes([
    Drive::DRIVE_FILE,
]);

        $this->service = new Drive($client);
    }

    public function upload($filePath, $fileName, $keep = 7, $prefix = '')
    {
        $fileMetadata = new DriveFile([
            'name' => $fileName,
            'parents' => [env('GOOGLE_DRIVE_FOLDER_ID')],
        ]);

        $this->service->files->create(
            $fileMetadata,
            [
                'data' => file_get_contents($filePath),
                'mimeType' => 'application/sql',
                'uploadType' => 'multipart',
            ]
        );

        $this->deleteOldFiles($keep, $prefix);
    }

    protected function deleteOldFiles($keep, $prefix)
    {
        $folderId = env('GOOGLE_DRIVE_FOLDER_ID');

        $files = $this->service->files->listFiles([
            'q' => "'{$folderId}' in parents and trashed = false",
            'fields' => 'files(id,name,createdTime)',
            'orderBy' => 'createdTime desc'
        ]);

        $list = collect($files->getFiles())
            ->filter(fn($f) => str_starts_with($f->getName(), $prefix))
            ->values();

        if ($list->count() <= $keep) {
            return;
        }

        foreach ($list->slice($keep) as $file) {
            $this->service->files->delete($file->getId());
        }
    }
}
