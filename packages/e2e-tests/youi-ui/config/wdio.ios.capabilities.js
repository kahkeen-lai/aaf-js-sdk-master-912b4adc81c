const iosCapabilities = [
  {
    app: '../../demos/demo-youitv/youi/build/tvos/Debug-appletvsimulator/YiDemo.app',
    automationName: 'YouiEngine',
    deviceName: 'Apple TV',
    platformName: 'YItvOS',
    udid: '86AA610A-6E8D-46BA-944D-55AB73826F14',
    noReset: true,
    youiEngineAppAddress: '127.0.0.1',
    showXcodeLog: true,
  },
];

exports.config = iosCapabilities;

// simulator:
// fullSourceTree: true
// deviceName: 'Apple TV',
// platformName: 'YItvOS',
// udid: '86AA610A-6E8D-46BA-944D-55AB73826F14',

// real device:
// app: '/Users/cz324b/Projects/xaaf-js-sdk/packages/demos/demo-youitv/youi/build/tvos/Debug-appletvos/YiDemo.app',
// automationName: 'YouiEngine',
// deviceName: 'celineTvos',
// platformName: 'tvOS',
// udid: '21d48812968e8dfed656c1f2b1e583323f090d2e',
// platformVersion: '13.4',
// noReset: true,
// youiEngineAppAddress: '192.168.1.3',
// showXcodeLog: true,
