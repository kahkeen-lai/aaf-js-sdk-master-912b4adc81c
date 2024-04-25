#!/bin/bash

FILE=$1

cat \
header.js \
ext/cj/cryptojs-312-core-fix.js \
ext/cj/sha256.js \
ext/prng4.js \
ext/rng.js \
ext/base64.js \
ext/jsbn.js \
ext/jsbn2.js \
ext/rsa.js \
ext/json-sans-eval.js \
src/asn1hex-1.1.js \
src/base64x-1.1.js \
src/crypto-1.1.js \
src/jws-3.3.js \
src/keyutil-1.0.js \
src/rsapem-1.1.js \
src/rsasign-1.2.js \
src/x509-1.1.js \
footer.js \
> ${FILE}