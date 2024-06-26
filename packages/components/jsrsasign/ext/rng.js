/*! (c) Tom Wu | http://www-cs-students.stanford.edu/~tjw/jsbn/
 */
// Random number generator - requires a PRNG backend, e.g. prng4.js

// For best results, put code like
// <body onClick='rng_seed_time();' onKeyPress='rng_seed_time();'>
// in your main HTML document.

var rng_state;
var rng_pool;
var rng_pptr;

// Mix in a 32-bit integer into the pool
function rng_seed_int(x) {
  rng_pool[rng_pptr++] ^= x & 255;
  rng_pool[rng_pptr++] ^= (x >> 8) & 255;
  rng_pool[rng_pptr++] ^= (x >> 16) & 255;
  rng_pool[rng_pptr++] ^= (x >> 24) & 255;
  if(rng_pptr >= rng_psize) rng_pptr -= rng_psize; // NOSONAR
}

// Mix in the current time (w/milliseconds) into the pool
function rng_seed_time() {
  rng_seed_int(new Date().getTime());
}

// Initialize the pool with junk if needed.
if (rng_pool == null) {
  rng_pool = new Array();
  rng_pptr = 0;
  var t;
  if (window !== undefined &&
      (window.crypto !== undefined ||
       window.msCrypto !== undefined)) {
    var crypto = window.crypto || window.msCrypto;
    if (crypto.getRandomValues) {
      // Use webcrypto if available
      var ua = new Uint8Array(32);
      crypto.getRandomValues(ua);
      for(t = 0; t < 32; ++t)
        rng_pool[rng_pptr++] = ua[t];
    } else if (navigator.appName == "Netscape" && navigator.appVersion < "5") {
      // Extract entropy (256 bits) from NS4 RNG if available
      var z = window.crypto.random(32);
      for(t = 0; t < z.length; ++t)
        rng_pool[rng_pptr++] = z.charCodeAt(t) & 255;
    }
  }
  while (rng_pptr < rng_psize) {  // extract some randomness from Math.random()
    t = Math.floor(65536 * Math.random());
    rng_pool[rng_pptr++] = t >>> 8;
    rng_pool[rng_pptr++] = t & 255;
  }
  rng_pptr = 0;
  rng_seed_time();
  //rng_seed_int(window.screenX);
  //rng_seed_int(window.screenY);
}


function SecureRandom() {}
