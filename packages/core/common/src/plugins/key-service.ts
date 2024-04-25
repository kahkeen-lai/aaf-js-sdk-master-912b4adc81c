export interface KeyService {
    verify(apiKey: string, environment: string): boolean;
    decode<T>(token: string): T;
}
