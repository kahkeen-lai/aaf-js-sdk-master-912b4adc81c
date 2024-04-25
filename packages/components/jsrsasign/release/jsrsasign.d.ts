// Type definitions for jsrsasign 8.0
// Project: https://github.com/kjur/jsrsasign
// Definitions by: Florian Keller <https://github.com/ffflorian>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
// TypeScript Version: 2.7

/**
 * convert a Base64URL encoded string to a ASCII string.
 * NOTE: This can't be used for Base64URL encoded non ASCII characters.
 * @param s Base64URL encoded string
 * @return ASCII string
 */
export declare function b64utos(s: string): string;

export declare namespace JWS {
    interface JWSResult {
        /** JSON object of header */
        headerObj: {
            alg: string;
            typ: string;
        };
        /** pretty printed JSON header by stringify */
        headerPP: string;
        /** JSON object of payload if payload is JSON string otherwise undefined */
        payloadObj?: unknown;
        /** pretty printed JSON payload by stringify if payload is JSON otherwise Base64URL decoded raw string of payload */
        payloadPP: string;
        /** hexadecimal string of signature */
        sigHex: string;
    }

    /**
     * parse header and payload of JWS signature
     * @param sJWS string of JWS signature to parse
     * @return associative array of parsed header and payload. See below.
     * @throws if sJWS is malformed JWS signature
     * @description
     * This method parses JWS signature string.
     * Resulted associative array has following properties:
     *
     * - headerObj - JSON object of header
     * - payloadObj - JSON object of payload if payload is JSON string otherwise undefined
     * - headerPP - pretty printed JSON header by stringify
     * - payloadPP - pretty printed JSON payload by stringify if payload is JSON otherwise Base64URL decoded raw string of payload
     * - sigHex - hexadecimal string of signature
     *
     * @example
     * KJUR.jws.JWS.parse(sJWS) ->
     * {
     *   headerObj: {"alg": "RS256", "typ": "JWS"},
     *   payloadObj: {"product": "orange", "quantity": 100},
     *   headerPP:
     *   '{
     *     "alg": "RS256",
     *     "typ": "JWS"
     *   }',
     *   payloadPP:
     *   '{
     *     "product": "orange",
     *     "quantity": 100
     *   }',
     *   sigHex: "91f3cd..."
     * }
     */
    function parse(sJWS: string): JWSResult;

    /**
     * @param sJWT string of JSON Web Token(JWT) to verify
     * @param key string of public key, certificate or key object to verify
     * @param acceptField associative array of acceptable fields (OPTION)
     * @return true if the JWT token is valid otherwise false
     *
     * @description
     * This method verifies a
     * [RFC 7519](https://tools.ietf.org/html/rfc7519)
     * JSON Web Token(JWT).
     * It will verify following:
     *
     * - Header.alg
     *
     * - alg is specified in JWT header.
     * - alg is included in acceptField.alg array. (MANDATORY)
     * - alg is proper for key.
     *
     *
     * - Payload.iss (issuer) - Payload.iss is included in acceptField.iss array if specified. (OPTION)
     * - Payload.sub (subject) - Payload.sub is included in acceptField.sub array if specified. (OPTION)
     * - Payload.aud (audience) - Payload.aud is included in acceptField.aud array or
     *     the same as value if specified. (OPTION)
     * - Time validity
     *
     * -
     * If acceptField.verifyAt as number of UNIX origin time is specifed for validation time,
     * this method will verify at the time for it, otherwise current time will be used to verify.
     *
     * -
     * Clock of JWT generator or verifier can be fast or slow. If these clocks are
     * very different, JWT validation may fail. To avoid such case, 'jsrsasign' supports
     * 'acceptField.gracePeriod' parameter which specifies acceptable time difference
     * of those clocks in seconds. So if you want to accept slow or fast in 2 hours,
     * you can specify <code>acceptField.gracePeriod = 2 * 60 * 60;</code>.
     * "gracePeriod" is zero by default.
     * "gracePeriod" is supported since jsrsasign 5.0.12.
     *
     * - Payload.exp (expire) - Validation time is smaller than Payload.exp + gracePeriod.
     * - Payload.nbf (not before) - Validation time is greater than Payload.nbf - gracePeriod.
     * - Payload.iat (issued at) - Validation time is greater than Payload.iat - gracePeriod.
     *
     *
     * - Payload.jti (JWT id) - Payload.jti is included in acceptField.jti if specified. (OPTION)
     * - JWS signature of JWS is valid for specified key.
     *
     *
     * __acceptField parameters__
     * Here is available acceptField argument parameters:
     *
     * - alg - array of acceptable signature algorithm names (["RS256"])
     * - iss - array of acceptable issuer names (ex. ['http://foo.com'])
     * - sub - array of acceptable subject names (ex. ['mailto:john@foo.com'])
     * - aud - array of acceptable audience name (ex. ['http://foo.com'])
     * - jti - string of acceptable JWT ID (OPTION) (ex. 'id1234')
     * -
     * verifyAt - time to verify 'nbf', 'iat' and 'exp' in UNIX seconds (OPTION) (ex. 1377663900).
     * If this is not specified, current time of verifier will be used.
     * `KJUR.jws.IntDate` may be useful to specify it.
     *
     * - gracePeriod - acceptable time difference between signer and verifier
     * in seconds (ex. 3600). If this is not specified, zero will be used.
     *
     *
     * @example
     * // simple validation for HS256
     * isValid = KJUR.jws.JWS.verifyJWT("eyJhbG...", "616161", {alg: ["HS256"]}),
     *
     * // full validation for RS or PS
     * pubkey = KEYUTIL.getKey('-----BEGIN CERT...');
     * isValid = KJUR.jws.JWS.verifyJWT('eyJh...', pubkey, {
     *   alg: ['RS256'],
     *   iss: ['http://foo.com'],
     *   sub: ['mailto:john@foo.com', 'mailto:alice@foo.com'],
     *   verifyAt: KJUR.jws.IntDate.get('20150520235959Z'),
     *   aud: ['http://foo.com'], // aud: 'http://foo.com' is fine too.
     *   jti: 'id123456',
     *   gracePeriod: 1 * 60 * 60 // accept 1 hour slow or fast
     * });
     */
    function verifyJWT(
        sJWT: string,
        key: string,
        acceptField?: {
            alg: string[];
            aud?: string[];
            iss?: string[];
            jti?: string;
            sub?: string[];
            verifyAt?: string | number;
        },
    ): boolean;

    /**
     * check whether a String "s" is a safe JSON string or not.
     * If a String "s" is a malformed JSON string or an other object type
     * this returns 0, otherwise this returns 1.
     * @param s JSON string
     * @return 1 or 0
     */
    function isSafeJSONString(s: string, h?: object, p?: string): 0 | 1;

    /**
     * read a String "s" as JSON object if it is safe.
     * If a String "s" is a malformed JSON string or not JSON string,
     * this returns null, otherwise returns JSON object.
     * @param s JSON string
     * @return JSON object or null
     */
    function readSafeJSONString(s: string): object | null;
}