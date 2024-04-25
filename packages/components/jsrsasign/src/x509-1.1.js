/* x509-1.1.21.js (c) 2012-2020 Kenji Urushima | kjur.github.io/jsrsasign/license
 */
/*
 * x509.js - X509 class to read subject public key from certificate.
 *
 * Copyright (c) 2010-2020 Kenji Urushima (kenji.urushima@gmail.com)
 *
 * This software is licensed under the terms of the MIT License.
 * https://kjur.github.io/jsrsasign/license
 *
 * The above copyright and license notice shall be
 * included in all copies or substantial portions of the Software.
 */

/**
 * @fileOverview
 * @name x509-1.1.js
 * @author Kenji Urushima kenji.urushima@gmail.com
 * @version jsrsasign 8.0.19 x509 1.1.21 (2020-Jun-21)
 * @since jsrsasign 1.x.x
 * @license <a href="https://kjur.github.io/jsrsasign/license/">MIT License</a>
 */

/**
 * hexadecimal X.509 certificate ASN.1 parser class.<br/>
 * @class hexadecimal X.509 certificate ASN.1 parser class
 * @property {String} hex hexacedimal string for X.509 certificate.
 * @property {Number} version format version (1: X509v1, 3: X509v3, otherwise: unknown) since jsrsasign 7.1.4
 * @author Kenji Urushima
 * @version 1.0.1 (08 May 2012)
 * @see <a href="https://kjur.github.io/jsrsasigns/">'jsrsasign'(RSA Sign JavaScript Library) home page https://kjur.github.io/jsrsasign/</a>
 * @description
 * X509 class provides following functionality:
 * <ul>
 * <li>parse X.509 certificate ASN.1 structure</li>
 * <li>get basic fields, extensions, signature algorithms and signature values</li>
 * <li>read PEM certificate</li>
 * </ul>
 *
 * <ul>
 * <li><b>TO GET FIELDS</b>
 *   <ul>
 *   <li>serial - {@link X509#getSerialNumberHex}</li>
 *   <li>signature algorithm field - {@link X509#getSignatureAlgorithmField}</li>
 *   <li>issuer - {@link X509#getIssuerHex}</li>
 *   <li>issuer - {@link X509#getIssuerString}</li>
 *   <li>notBefore - {@link X509#getNotBefore}</li>
 *   <li>notAfter - {@link X509#getNotAfter}</li>
 *   <li>subject - {@link X509#getSubjectHex}</li>
 *   <li>subject - {@link X509#getSubjectString}</li>
 *   <li>subjectPublicKeyInfo - {@link X509#getPublicKey}</li>
 *   <li>subjectPublicKeyInfo - {@link X509#getPublicKeyHex}</li>
 *   <li>subjectPublicKeyInfo - {@link X509#getPublicKeyIdx}</li>
 *   <li>subjectPublicKeyInfo - {@link X509.getPublicKeyFromCertPEM}</li>
 *   <li>subjectPublicKeyInfo - {@link X509.getPublicKeyFromCertHex}</li>
 *   <li>subjectPublicKeyInfo - {@link X509#getPublicKeyContentIdx}</li>
 *   <li>signature algorithm - {@link X509#getSignatureAlgorithmName}</li>
 *   <li>signature value - {@link X509#getSignatureValueHex}</li>
 *   </ul>
 * </li>
 * <li><b>X509 METHODS TO GET EXTENSIONS</b>
 *   <ul>
 *   <li>basicConstraints - {@link X509#getExtBasicConstraints}</li>
 *   <li>keyUsage - {@link X509#getExtKeyUsageBin}</li>
 *   <li>keyUsage - {@link X509#getExtKeyUsageString}</li>
 *   <li>subjectKeyIdentifier - {@link X509#getExtSubjectKeyIdentifier}</li>
 *   <li>authorityKeyIdentifier - {@link X509#getExtAuthorityKeyIdentifier}</li>
 *   <li>extKeyUsage - {@link X509#getExtExtKeyUsageName}</li>
 *   <li>subjectAltName(DEPRECATED) - {@link X509#getExtSubjectAltName}</li>
 *   <li>subjectAltName2 - {@link X509#getExtSubjectAltName2}</li>
 *   <li>cRLDistributionPoints - {@link X509#getExtCRLDistributionPointsURI}</li>
 *   <li>authorityInfoAccess - {@link X509#getExtAIAInfo}</li>
 *   <li>certificatePolicies - {@link X509#getExtCertificatePolicies}</li>
 *   </ul>
 * </li>
 * <li><b>UTILITIES</b>
 *   <ul>
 *   <li>reading PEM X.509 certificate - {@link X509#readCertPEM}</li>
 *   <li>reading hexadecimal string of X.509 certificate - {@link X509#readCertHex}</li>
 *   <li>get all certificate information - {@link X509#getInfo}</li>
 *   <li>get specified extension information - {@link X509#getExtInfo}</li>
 *   <li>verify signature value - {@link X509#verifySignature}</li>
 *   </ul>
 * </li>
 * </ul>
 */
function X509() {}

/* ======================================================================
 *   Specific V3 Extensions
 * ====================================================================== */

X509.KEYUSAGE_NAME = [
    "digitalSignature",
    "nonRepudiation",
    "keyEncipherment",
    "dataEncipherment",
    "keyAgreement",
    "keyCertSign",
    "cRLSign",
    "encipherOnly",
    "decipherOnly"
];
