import  { default as DeviceInfoReactNative } from 'react-native-device-info';

export const DeviceInfo = () => {
    const getDeviceId = () => DeviceInfoReactNative.getDeviceId() ?? '';
    const getDeviceModel = () => DeviceInfoReactNative.getModel() ?? '';
    const getDeviceType = () => DeviceInfoReactNative.getDeviceType() ?? '';
    const getSystemName = () => DeviceInfoReactNative.getSystemName() ?? '';
    const getSystemVersion = () => DeviceInfoReactNative.getSystemVersion() ?? '';
    
    const getDeviceName = async (): Promise<string> => {
        try {
            const deviceName = await DeviceInfoReactNative.getDeviceName();
            return deviceName ?? '';
        } catch {
            return '';
        }
    }

    const getDeviceManufacturer = async (): Promise<string> => {
        try {
            const manufacturer = await DeviceInfoReactNative.getManufacturer();
            return manufacturer ?? '';
        } catch {
            return '';
        }
    }

    return {
        getDeviceId,
        getDeviceModel,
        getDeviceType,
        getSystemName,
        getSystemVersion,
        getDeviceName,
        getDeviceManufacturer,
    }
}