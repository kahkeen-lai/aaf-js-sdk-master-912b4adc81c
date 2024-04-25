import { b64utos, JWS } from '@xaaf/jsrsasign';
import { publicKeys } from './public-keys';

export class KeyService {
    verify(apiKey: string, environment: string): boolean {
        if (!apiKey || apiKey.length === 0) {
            return false;
        }

        if (!environment || environment.length === 0) {
            return false;
        }

        const isAIO: boolean = environment.startsWith('tlv-advertise-');
        const base64PublicKey: string | null = isAIO ? publicKeys.get('tlv-aio') : publicKeys.get(environment);

        if (!base64PublicKey) {
            return false;
        }

        try {
            const pubKey: string = b64utos(base64PublicKey);
            return JWS.verifyJWT(apiKey, pubKey, { alg: ['RS256'] });
        } catch (error) {
            return false;
        }
    }

    decode<T>(token: string): T {
        if (token) {
            const { payloadObj }: JWS.JWSResult = JWS.parse(token);
            return payloadObj as T;
        } else {
            throw new Error('no token to validate');
        }
    }
}
