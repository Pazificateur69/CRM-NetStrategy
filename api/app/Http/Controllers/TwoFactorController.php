<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Laravel\Fortify\Actions\EnableTwoFactorAuthentication;
use Laravel\Fortify\Actions\DisableTwoFactorAuthentication;
use Laravel\Fortify\Actions\ConfirmTwoFactorAuthentication;
use Laravel\Fortify\Actions\GenerateNewRecoveryCodes;

class TwoFactorController extends Controller
{
    /**
     * Active le 2FA pour l'utilisateur (génère le secret mais ne le confirme pas encore)
     */
    public function enable(Request $request, EnableTwoFactorAuthentication $enable)
    {
        $enable($request->user());

        return response()->json([
            'status' => 'enabled_pending_confirmation',
            'qr_code' => $request->user()->twoFactorQrCodeSvg(),
            'secret' => decrypt($request->user()->two_factor_secret),
            'recovery_codes' => json_decode(decrypt($request->user()->two_factor_recovery_codes)),
        ]);
    }

    /**
     * Confirme le 2FA avec un code OTP valide
     */
    public function confirm(Request $request, ConfirmTwoFactorAuthentication $confirm)
    {
        $request->validate(['code' => 'required|string']);

        $confirm($request->user(), $request->code);

        return response()->json(['status' => 'confirmed']);
    }

    /**
     * Désactive le 2FA
     */
    public function disable(Request $request, DisableTwoFactorAuthentication $disable)
    {
        $disable($request->user());
        return response()->json(['status' => 'disabled']);
    }

    /**
     * Récupère les codes de récupération
     */
    public function getRecoveryCodes(Request $request)
    {
        if (!$request->user()->two_factor_secret) {
            return response()->json(['message' => '2FA not enabled'], 400);
        }

        return response()->json([
            'recovery_codes' => json_decode(decrypt($request->user()->two_factor_recovery_codes)),
        ]);
    }

    /**
     * Régénère les codes de récupération
     */
    public function regenerateRecoveryCodes(Request $request, GenerateNewRecoveryCodes $generate)
    {
        $generate($request->user());

        return response()->json([
            'recovery_codes' => json_decode(decrypt($request->user()->two_factor_recovery_codes)),
        ]);
    }
}
