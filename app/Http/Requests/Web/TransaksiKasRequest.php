<?php

namespace App\Http\Requests\Web;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class TransaksiKasRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
         return [
            'user_id' => ['nullable', 'exists:users,id'],
            'jenis' => ['required', 'in:masuk,keluar'],
            'kategori' => ['required', 'in:simpanan,pinjaman,angsuran,operasional,lainnya'],
            'jumlah' => ['required', 'numeric', 'min:0'],
            'keterangan' => ['nullable', 'string'],
            'tanggal' => ['required', 'date'],
            'status' => ['required', 'in:pending,berhasil,dibatalkan'],
        ];
    }
}
