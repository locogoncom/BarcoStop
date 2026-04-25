<?php

declare(strict_types=1);

namespace BarcoStop\ServerPhp\Services;

/**
 * Verifies Google idToken using Google's tokeninfo endpoint.
 * This keeps backend ownership of auth decisions with minimal dependencies.
 */
final class GoogleIdTokenVerifier
{
    /**
     * @param string[] $allowedClientIds
     * @return array{ok:bool,error:string,email?:string,name?:string,sub?:string,picture?:string,aud?:string,iss?:string}
     */
    public function verify(string $idToken, array $allowedClientIds): array
    {
        $token = trim($idToken);
        if ($token === '') {
            return ['ok' => false, 'error' => 'Google idToken vacio'];
        }

        if (empty($allowedClientIds)) {
            return ['ok' => false, 'error' => 'GOOGLE_ALLOWED_CLIENT_IDS no configurado'];
        }

        $payload = $this->fetchTokenInfo($token);
        if ($payload === null) {
            return ['ok' => false, 'error' => 'No se pudo validar token Google'];
        }

        $issuer = trim((string) ($payload['iss'] ?? ''));
        if ($issuer !== 'accounts.google.com' && $issuer !== 'https://accounts.google.com') {
            return ['ok' => false, 'error' => 'Issuer de Google invalido'];
        }

        $audience = trim((string) ($payload['aud'] ?? ''));
        if ($audience === '' || !in_array($audience, $allowedClientIds, true)) {
            return ['ok' => false, 'error' => 'Client ID no autorizado'];
        }

        $exp = (int) ($payload['exp'] ?? 0);
        if ($exp <= time()) {
            return ['ok' => false, 'error' => 'Token Google expirado'];
        }

        $email = strtolower(trim((string) ($payload['email'] ?? '')));
        if ($email === '') {
            return ['ok' => false, 'error' => 'Token Google sin email'];
        }

        $emailVerified = strtolower(trim((string) ($payload['email_verified'] ?? 'false')));
        if (!in_array($emailVerified, ['true', '1'], true)) {
            return ['ok' => false, 'error' => 'Email de Google no verificado'];
        }

        return [
            'ok' => true,
            'error' => '',
            'email' => $email,
            'name' => trim((string) ($payload['name'] ?? '')),
            'sub' => trim((string) ($payload['sub'] ?? '')),
            'picture' => trim((string) ($payload['picture'] ?? '')),
            'aud' => $audience,
            'iss' => $issuer,
        ];
    }

    private function fetchTokenInfo(string $idToken): ?array
    {
        $url = 'https://oauth2.googleapis.com/tokeninfo?id_token=' . rawurlencode($idToken);
        $response = null;

        if (function_exists('curl_init')) {
            $ch = curl_init($url);
            if ($ch !== false) {
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($ch, CURLOPT_TIMEOUT, 8);
                curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 4);
                curl_setopt($ch, CURLOPT_HTTPHEADER, ['Accept: application/json']);
                $raw = curl_exec($ch);
                $status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
                curl_close($ch);
                if (is_string($raw) && $status >= 200 && $status < 300) {
                    $response = $raw;
                }
            }
        }

        if ($response === null) {
            $context = stream_context_create([
                'http' => [
                    'method' => 'GET',
                    'timeout' => 8,
                    'header' => "Accept: application/json\r\n",
                ],
            ]);
            $raw = @file_get_contents($url, false, $context);
            if (is_string($raw) && $raw !== '') {
                $response = $raw;
            }
        }

        if ($response === null || trim($response) === '') {
            return null;
        }

        $decoded = json_decode($response, true);
        if (!is_array($decoded)) {
            return null;
        }

        if (!empty($decoded['error'])) {
            return null;
        }

        return $decoded;
    }
}
