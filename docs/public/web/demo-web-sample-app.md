# Demo Web Sample App

## Where to get it from

Download the appropriate version of the `demo-web` from the `@xaaf/demo-web/` path from the `https://repocentral.it.att.com:8443/nexus/#browse/browse:npm-advertise` repo. 

## How to run it

### Python

#### Python 2

1. Unpack the downloaded `demo-web-XYZ.tgz`
1. Open Terminal and go to the `build` folder in the unpacked folder
1. Run `python -m SimpleHTTPServer 5000`
1. Open http://localhost:5000 in your favorite browser

#### Python 3

1. Unpack the downloaded `demo-web-XYZ.tgz`
1. Open terminal and go to the `build` folder in the unpacked folder
1. Run `python -m http.server 5000`
1. Open http://localhost:5000 in your favorite browser

### Node.js

1. Unpack the downloaded `demo-web-XYZ.tgz`
1. Open terminal and go to the unpacked folder
1. Install `serve` dependency with `npm install -g serve` (if you want to install the dependency locally, omit the `-g` option, i.e. `npm install serve`)
1. Once installed go to the `build` folder in the unpacked folder
1. Run
    * `serve -l 5000` if `serve` was installed globally   
    or
    * `npx serve -l 5000` if `serve` was installed locally
1. Open http://localhost:5000 in your favorite browser
