<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\OrganizationSetting;

class OrganizationController extends Controller
{
    public function getSettings()
    {
        return OrganizationSetting::all()->mapWithKeys(function ($item) {
            return [$item->key => $item->value];
        });
    }

    public function updateSettings(Request $request)
    {
        $data = $request->validate([
            'settings' => 'required|array',
        ]);

        foreach ($data['settings'] as $key => $value) {
            OrganizationSetting::updateOrCreate(
                ['key' => $key],
                ['value' => $value]
            );
        }

        return response()->json(['message' => 'Settings updated']);
    }
}
