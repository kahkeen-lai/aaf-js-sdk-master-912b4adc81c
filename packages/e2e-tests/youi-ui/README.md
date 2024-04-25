Prerequisites
=============
0. EXCEPT FOR THE BUILDING STAGES - DO NOT USE VPN
1. Node installed.

Prerequisites for iOS/tvOS
==========================
1. Brew installed (https://brew.sh/)
2. Brew dependencies installed (run `brew bundle` from this Directory)

Steps
=====
1. Run yarn, yarn bootstrap and build project release / debug
2. Connect your device / simulator to your machine (N/A to mac)
3. Run `npm install` from this Directory (e2e-tests/youi-ui)
4. Configure the capabilities for your platform in `wdio.[platformName].conf.js` based on platform requirements:
    1. https://github.com/YOU-i-Labs/appium-youiengine-driver#minimum-required-capabilities-per-platform
    2. You need to change the app path to an absolute path.
    3. Change the deviceName to your device name.
5. Build application release/debug and install it on device. 
6. For tvOs run instruments -r devices to understand what is the id of the device and paste that as udid in conf.fs
7. Run yarn e2e-<happy-test/unhappy-test>:<tvos/android> from this Directory (e2e-tests/youi-ui)
8. To use appium layout inspector:
    1. Install Appium desktop app:
       1. Click Edit Configurations
       2. Wait...
       3. Provide ANDROID_HOME and JAVA_HOME paths
       4. Click 'Save and Restart'
       5. Appium saves the config but restart does not work
       6. Close the app and reopen
    2. Click start server with default host and port
    3. Click start inspector session 
    4. run 'adb forward tcp:12345 tcp:12345'
    5. enter json with desired capabilities:
        for example (need to change app path and device name):
        1. FireTV setup:
        {
          "automationName": "YouiEngine",
          "platformName": "android",
          "deviceName": "device",
          "app": "/Users/cz324b/Projects/xaaf-js-sdk/packages/demos/demo-youitv/youi/build/android/project/yidemo/build/outputs/apk/debug/yidemo-debug.apk",
          "youiEngineAppAddress": "localhost",
          "fullSourceTree": "true"
        }
        2. Android setup: {
            "automationName": "YouiEngine",
            "platformName": "android",
            "deviceName": "emulator-5554",
            "app": "/Users/cz324b/Projects/xaaf-js-sdk/packages/demos/demo-youitv/youi/build/android/project/yidemo/build/outputs/apk/debug/yidemo-debug.apk",
            "youiEngineAppAddress": "localhost",
            "fullSourceTree": "true"
        }

        web: http://192.168.1.3:3000
        {
            "deviceName": "emulator-5554",
            "browserName": "Chrome",
            "platformName": "android",
            "platformVersion": "10",
            "chromedriverExecutable": "/Users/cz324b/Downloads/chromedriver"
        }
        3. AppleTV setup: {}
    6. Open yidemo or any other app you want to extract ids for
    7. Click start session.

Currently, supported platforms: android, ios, connect-to-app (ignores installer/launcher), yimac, yibluesky, yitvos.
See https://github.com/YOU-i-Labs/appium-youiengine-driver for more details on supported search strategies, commands and attributes.
