import { default as NonEncryptedAsyncStorage } from '@react-native-async-storage/async-storage';

export default class SecureAsyncStorage {
    static setItem = async(key: string, value: string): Promise<void> => {
        return await NonEncryptedAsyncStorage.setItem(key, value)
            .then((response) => response)
            .catch((e) => e)
    }


    static getItem = async(key: string): Promise<string> => {
        return await NonEncryptedAsyncStorage.getItem(key)
        .then((value) => value)
        .catch((error) => error);
    }

    static removeItem = async(key: string): Promise<void> => {
        return await NonEncryptedAsyncStorage.removeItem(key)
            .then((response) => response)
            .catch((e) => e);
    }

    static getAllKeys = async(): Promise<string[]> => {
        return await NonEncryptedAsyncStorage.getAllKeys()
            .then((keys) => keys)
            .catch((e) => e);
    }

    static multiGet = async(
        keys: string[],
        callback?: (errors?: Error[], result?: [string, string][]) => void
    ): Promise<[string, string][]> => {
        return await NonEncryptedAsyncStorage.multiGet(keys, callback)
            .then((results) => results)
            .catch((e) => e);
    }

    static multiRemove = async(keys: string[], callback?: (errors?: Error[]) => void): Promise<void> => {
        return await NonEncryptedAsyncStorage.multiRemove(keys, callback)
            .then((res) => res)
            .catch((e) => e);
    }
}