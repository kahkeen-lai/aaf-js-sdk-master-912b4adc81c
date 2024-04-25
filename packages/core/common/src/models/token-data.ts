export interface TokenData {
    tenantId: string;
    tenantName: string;
    appId: string;
    platformName: string;
    sdkVersion: string;
    sdkName: string;
    enabled: boolean;
    host: string;
    privilegeType: string;
    environment: string;
    apiKeyIat: number;
    iat: number;
    exp: number;
    iss: string;
    sub: string;
}
