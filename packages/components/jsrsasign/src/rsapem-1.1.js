/* rsapem-1.3.0.js (c) 2012-2017 Kenji Urushima | kjur.github.com/jsrsasign/license
 */
/*
 * rsapem.js - Cryptographic Algorithm Provider class
 *
 * Copyright (c) 2013-2017 Kenji Urushima (kenji.urushima@gmail.com)
 *
 * This software is licensed under the terms of the MIT License.
 * https://kjur.github.io/jsrsasign/license
 *
 * The above copyright and license notice shall be 
 * included in all copies or substantial portions of the Software.
 */

/**
 * @fileOverview
 * @name rsapem-1.1.js
 * @author Kenji Urushima kenji.urushima@gmail.com
 * @version jsrsasign 8.0.0 rsapem 1.3.0 (2017-Jun-24)
 * @since jsrsasign 1.0
 * @license <a href="https://kjur.github.io/jsrsasign/license/">MIT License</a>
 */

/**
 * read an ASN.1 hexadecimal string of PKCS#5 RSA public key<br/>
 * @name readPKCS5PubKeyHex
 * @memberOf RSAKey#
 * @function
 * @param {String} h hexadecimal string of PKCS#5 public key
 * @since jsrsasign 7.1.0 rsapem 1.2.0
 */
RSAKey.prototype.readPKCS5PubKeyHex = function(h) { // NOSONAR
    var _ASN1HEX = ASN1HEX; // NOSONAR
    var _getV = _ASN1HEX.getV;

    if (_ASN1HEX.isASN1HEX(h) === false) // NOSONAR
	throw "keyHex is not ASN.1 hex string";
    var aIdx = _ASN1HEX.getChildIdx(h, 0);
    if (aIdx.length !== 2 || // NOSONAR
	h.substr(aIdx[0], 2) !== "02" ||
	h.substr(aIdx[1], 2) !== "02")
	throw "wrong hex for PKCS#5 public key";
    var hN = _getV(h, aIdx[0]);
    var hE = _getV(h, aIdx[1]);
    this.setPublic(hN, hE);
};

/**
 * read an ASN.1 hexadecimal string of PKCS#8 RSA public key<br/>
 * @name readPKCS8PubKeyHex
 * @memberOf RSAKey#
 * @function
 * @param {String} h hexadecimal string of PKCS#8 public key
 * @since jsrsasign 7.1.0 rsapem 1.2.0
 */
RSAKey.prototype.readPKCS8PubKeyHex = function(h) {
    var _ASN1HEX = ASN1HEX;
    if (_ASN1HEX.isASN1HEX(h) === false) // NOSONAR
	throw "not ASN.1 hex string";

    // 06092a864886f70d010101: OBJECT IDENTIFIER rsaEncryption (1 2 840 113549 1 1 1)
    if (_ASN1HEX.getTLVbyList(h, 0, [0, 0]) !== "06092a864886f70d010101") // NOSONAR
	throw "not PKCS8 RSA public key";

    var p5hex = _ASN1HEX.getTLVbyList(h, 0, [1, 0]);
    this.readPKCS5PubKeyHex(p5hex);
};