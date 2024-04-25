import { JWS, b64utos } from '@xaaf/jsrsasign';
import { KeyService } from './key-service';
const service: KeyService = new KeyService();

test('should validate JWT from DER', () => {
    const JWT =
        'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0ZW5hbnRJZCI6IjVlNmY0MmZlZmM4MTU5MDAxYmIyMTlmMCIsImFwcElkIjoiNWU2ZjQyZmZmYzgxNTkwMDFiYjIxOWYyIiwicGxhdGZvcm1OYW1lIjoiZmlyZXR2Iiwic2RrVmVyc2lvbiI6InYxIiwic2RrTmFtZSI6ImpzLXNkay15b3VpIiwiZW5hYmxlZCI6dHJ1ZSwiaG9zdCI6Imh0dHBzOi8veGFhZi1haW8udGx2LWRldm9wcy5jb20vYWR2ZXJ0aXNlLTU5ODgiLCJwcml2aWxlZ2VUeXBlIjoidGVzdGVyIiwiZW52aXJvbm1lbnQiOiJ0bHYtYWR2ZXJ0aXNlLTU5ODgiLCJpYXQiOjE1ODk4MDY5NTYsImlzcyI6IkFUJlQiLCJzdWIiOiJBcGlLZXkifQ.UayyxQDOJJRtB_udj1NDjjZvT8FEfdKu95BzLXRElmpxb8UL8nQCezGGUs12q91Wpp6B5pAQ3704gehLIgXZQztkLu084Gg4NWtkQjv8wqrlK3f5Yl5BslvepnnLnHEDjrSA6o0FYHSGnnHZ10irYG7TrtJ59cV1OYxgQk8dHpzEoe_CBv7rwHGvGjJr5WCYEYaGSGNUZMKNOUN63jpX-3HqXGeIMIY9XjmZaFIJ0S95bC2nQRfnQmZ5MRequn44f6PNYdCDwtsMRQ6kcJW1d_i7jCOtQoENnzxj-kVXnLXflJ0M0agYaGvL7IjSDA2LkKc0hataUAZ4JkN_aUB8Mg';
    const DER = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAg7CylsYYd7bYxfJHqf3y
sxi5vSBC62f7nZjIsgRtd8TkF9d03U/+heP7689DZX8YiuwlGkFygO9Zt2pOdzJg
dmOOfh22kMk0qGgKNREVeSx/DiY3+epIRtmcApPlZTnL+H01KdsgfKUj4UJNCYv5
/h8kOs8uB8HM4N5uaf5lTKCAl9rGOW9lfxvctaiM6Svcdfz+7cPH64Iczq/N/Gk0
PNUUztLXCO9YPHVDUm21m90zEkbVMouhR8i2MlNYon0ma8QM5UwgFf+oIjCxoe5Z
kzG64r8hQPKINJKca0ES2LB4fQjB7eiuflW3aeR8TknBKNVz0bMuJoFOQDc9maHr
3QIDAQAB
-----END PUBLIC KEY-----`;

    const isValid = JWS.verifyJWT(JWT, DER, { alg: ['RS256'] });
    expect(isValid).toBe(true);
});

test('should validate JWT from base64 pK', () => {
    const JWT =
        'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0ZW5hbnRJZCI6IjVkNzc2ZTM0MTdiZmE0MDAxOTgyZjRmNCIsImFwcElkIjoiNWQ3NzZlMzQ4MmU4YWIwMDE5ODNhY2Q5IiwicGxhdGZvcm1OYW1lIjoiZmlyZXR2Iiwic2RrVmVyc2lvbiI6InYxIiwic2RrTmFtZSI6ImFuZHJvaWR0diIsImVuYWJsZWQiOnRydWUsImVudmlyb25tZW50IjoidGx2LWxhbCIsImlhdCI6MTU2ODEwODA4NSwiaXNzIjoiQVQmVCIsInN1YiI6IkFwaUtleSJ9.aa5NbkiJtZn6tHlF_e8oAUBKeY2beqPe8dtITpkL6xN1-0FyB0uueXgxdaXXM2XfCF-irLpVeOZBm2I3eT5HQt-H-ZqeClMc25tonjQqWkGOh17zjbUJdqcMWAj01H1J0J3AmZK0dvoaC76HrCfdLfBtT2tldlntaQ5uCeXnkvvwAkAaRCDUxVU3pQdCU_3tlQD7H5_sfkf730Wh0_92aByg-z932QUNIWckPg50arm6CGnaWE2DNZM1seVyEmRQqW5ercXEXuAnnFA_vvgYomfDYrE0i4Osq5M5Tq2dvkZB7AGdoHrFLKQfle5ilzPyYFB04f0xJ8cd-1zcaND8Uw';
    const base64pK =
        'LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FROEFNSUlCQ2dLQ0FRRUFnQ2xSbW92ZHZwdkIvOHBnem9pSwpMZTB4dTRLaURQS1FVL2xvS2Z5TkNsdlVTcm1LUXo4ZGxVTER0Y1VMb0ltTEU2OFdMYWl1eXdYTzZyTU4yN1QrCmdrdDBYM3JvSnpPa0NaRkhEVDJZTVAvTnF0RytZTXFtSnc3bUlGRlhUcm9vSmlpQ3pHRHAzZmpzRW4rdlU4b3YKUlpJbUpZdS92c3FmUWhIMzFRUks0ckVyYjRvcE9uZTBqZ04reXhwT3RETURuTkxPNmNJS3lLbWdFMmlSa2x2bQpqRlhKNVhiVFpVdHR5UUpWbVJsMGhMbG4rUUtIa2d5Ni8vUml5ME5qSGx3T2R3OEhwWTBkTURWYy93WmZyWkZJCmRUcnc2cXBraHh3RlMvWCs4NUpVWmhlY04rcTE1cW5FOHNuQjZqR2xpRTlJL29xdDE3UFluRDUrS2k0SGN1S2gKV3dJREFRQUIKLS0tLS1FTkQgUFVCTElDIEtFWS0tLS0t';
    const DER = b64utos(base64pK);

    const isValid = JWS.verifyJWT(JWT, DER, { alg: ['RS256'] });
    expect(isValid).toBe(true);
});

test('should fail to validate JWT on incorrect signature', () => {
    const JWT =
        'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0ZW5hbnRJZCI6IjVlNmY0MmZlZmM4MTU5MDAxYmIyMTlmMCIsImFwcElkIjoiNWU2ZjQyZmZmYzgxNTkwMDFiYjIxOWYyIiwicGxhdGZvcm1OYW1lIjoiZmlyZXR2Iiwic2RrVmVyc2lvbiI6InYxIiwic2RrTmFtZSI6ImpzLXNkay15b3VpIiwiZW5hYmxlZCI6dHJ1ZSwiaG9zdCI6Imh0dHBzOi8veGFhZi1haW8udGx2LWRldm9wcy5jb20vYWR2ZXJ0aXNlLTU5ODgiLCJwcml2aWxlZ2VUeXBlIjoidGVzdGVyIiwiZW52aXJvbm1lbnQiOiJ0bHYtYWR2ZXJ0aXNlLTU5ODgiLCJpYXQiOjE1ODk4MDY5NTYsImlzcyI6IkFUJlQiLCJzdWIiOiJBcGlLZXkifQ.UayyxQDOJJRtB_udj1NDjjZvT8FEfdKu95BzLXRElmpxb8UL8nQCezGGUs12q91Wpp6B5pAQ3704gehLIgXZQztkLu084Gg4NWtkQjv8wqrlK3f5Yl5BslvepnnLnHEDjrSA6o0FYHSGnnHZ10irYG7TrtJ59cV1OYxgQk8dHpzEoe_CBv7rwHGvGjJr5WCYEYaGSGNUZMKNOUN63jpX-3HqXGeIMIY9XjmZaFIJ0S95bC2nQRfnQmZ5MRequn44f6PNYdCDwtsMRQ6kcJW1d_i7jCOtQoENnzxj-kVXnLXflJ0M0agYaGvL7IjSDA2LkKc0hataUAZ4JkN_aUB8Mg';
    const DER = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAg7CylsYYd7bYxfJHqf3y
sxi5vSBC62f7nZjIsgRtd8TkF9d03U/+heP7689DZX8YiuwlGkFygO9Zt2pOdzJg
dmOOfh22kMk0qGgKNREVeSx/DiY3+epIRtmcApdlZTnL+H01KdsgfKUj4UJNCYv5
/h8kOs8uB8HM4N5uaf5lTKCAl9rGOW9lfxvctaiM6Svcdfz+7cPH64Iczq/N/Gk0
PNUUztLXCO9YPHVDUm21m90zEkbVMouhR8i2MlNYon0ma8QM5UwgFf+oIjCxoe5Z
kzG64r8hQPKINJKca0ES2LB4fQjB7eiuflW3aeR8TknBKNVz0bMuJoFOQDc9maHr
3QIDAQAB
-----END PUBLIC KEY-----`;

    const isValid = JWS.verifyJWT(JWT, DER, { alg: ['RS256'] });
    expect(isValid).toBe(false);
});

test('should fail to validate JWT on incorrect JWT', () => {
    const JWT =
        'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0ZW5hbnRJZCI6IjVlNmY0MmZlZmM4MTU5MDAxYmIyMTlmMCIsImFwcElkIjoiNWU2ZjQyZmZmYzgxNTkwMDFiYjIxOWYyIiwicGxhdGZvcm1OYW1lIjoiZmlyZXR2Iiwic2RrVmVyc2lvbiI6InYxIiwic2RrTmFtZSI6ImpzLXNkay15b3VpIiwiZW5hYmxlZCI6dHJ1ZSwiaG9zdCI6Imh0dHBzOi8veGFhZi1haW8udGx2LWRldd9wcy5jb20vYWR2ZXJ0aXNlLTU5ODgiLCJwcml2aWxlZ2VUeXBlIjoidGVzdGVyIiwiZW52aXJvbm1lbnQiOiJ0bHYtYWR2ZXJ0aXNlLTU5ODgiLCJpYXQiOjE1ODk4MDY5NTYsImlzcyI6IkFUJlQiLCJzdWIiOiJBcGlLZXkifQ.UayyxQDOJJRtB_udj1NDjjZvT8FEfdKu95BzLXRElmpxb8UL8nQCezGGUs12q91Wpp6B5pAQ3704gehLIgXZQztkLu084Gg4NWtkQjv8wqrlK3f5Yl5BslvepnnLnHEDjrSA6o0FYHSGnnHZ10irYG7TrtJ59cV1OYxgQk8dHpzEoe_CBv7rwHGvGjJr5WCYEYaGSGNUZMKNOUN63jpX-3HqXGeIMIY9XjmZaFIJ0S95bC2nQRfnQmZ5MRequn44f6PNYdCDwtsMRQ6kcJW1d_i7jCOtQoENnzxj-kVXnLXflJ0M0agYaGvL7IjSDA2LkKc0hataUAZ4JkN_aUB8Mg';
    const DER = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAg7CylsYYd7bYxfJHqf3y
sxi5vSBC62f7nZjIsgRtd8TkF9d03U/+heP7689DZX8YiuwlGkFygO9Zt2pOdzJg
dmOOfh22kMk0qGgKNREVeSx/DiY3+epIRtmcApdlZTnL+H01KdsgfKUj4UJNCYv5
/h8kOs8uB8HM4N5uaf5lTKCAl9rGOW9lfxvctaiM6Svcdfz+7cPH64Iczq/N/Gk0
PNUUztLXCO9YPHVDUm21m90zEkbVMouhR8i2MlNYon0ma8QM5UwgFf+oIjCxoe5Z
kzG64r8hQPKINJKca0ES2LB4fQjB7eiuflW3aeR8TknBKNVz0bMuJoFOQDc9maHr
3QIDAQAB
-----END PUBLIC KEY-----`;

    const isValid = JWS.verifyJWT(JWT, DER, { alg: ['RS256'] });
    expect(isValid).toBe(false);
});

test('should throw on invalid JWT', () => {
    const JWT = 'foo';
    const DER = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAg7CylsYYd7bYxfJHqf3y
sxi5vSBC62f7nZjIsgRtd8TkF9d03U/+heP7689DZX8YiuwlGkFygO9Zt2pOdzJg
dmOOfh22kMk0qGgKNREVeSx/DiY3+epIRtmcApdlZTnL+H01KdsgfKUj4UJNCYv5
/h8kOs8uB8HM4N5uaf5lTKCAl9rGOW9lfxvctaiM6Svcdfz+7cPH64Iczq/N/Gk0
PNUUztLXCO9YPHVDUm21m90zEkbVMouhR8i2MlNYon0ma8QM5UwgFf+oIjCxoe5Z
kzG64r8hQPKINJKca0ES2LB4fQjB7eiuflW3aeR8TknBKNVz0bMuJoFOQDc9maHr
3QIDAQAB
-----END PUBLIC KEY-----`;

    expect.assertions(1);
    try {
        JWS.verifyJWT(JWT, DER, { alg: ['RS256'] });
    } catch (error) {
        expect(error).toBeDefined();
    }
});

test('should throw on invalid signature', () => {
    const JWT =
        'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0ZW5hbnRJZCI6IjVlNmY0MmZlZmM4MTU5MDAxYmIyMTlmMCIsImFwcElkIjoiNWU2ZjQyZmZmYzgxNTkwMDFiYjIxOWYyIiwicGxhdGZvcm1OYW1lIjoiZmlyZXR2Iiwic2RrVmVyc2lvbiI6InYxIiwic2RrTmFtZSI6ImpzLXNkay15b3VpIiwiZW5hYmxlZCI6dHJ1ZSwiaG9zdCI6Imh0dHBzOi8veGFhZi1haW8udGx2LWRldm9wcy5jb20vYWR2ZXJ0aXNlLTU5ODgiLCJwcml2aWxlZ2VUeXBlIjoidGVzdGVyIiwiZW52aXJvbm1lbnQiOiJ0bHYtYWR2ZXJ0aXNlLTU5ODgiLCJpYXQiOjE1ODk4MDY5NTYsImlzcyI6IkFUJlQiLCJzdWIiOiJBcGlLZXkifQ.UayyxQDOJJRtB_udj1NDjjZvT8FEfdKu95BzLXRElmpxb8UL8nQCezGGUs12q91Wpp6B5pAQ3704gehLIgXZQztkLu084Gg4NWtkQjv8wqrlK3f5Yl5BslvepnnLnHEDjrSA6o0FYHSGnnHZ10irYG7TrtJ59cV1OYxgQk8dHpzEoe_CBv7rwHGvGjJr5WCYEYaGSGNUZMKNOUN63jpX-3HqXGeIMIY9XjmZaFIJ0S95bC2nQRfnQmZ5MRequn44f6PNYdCDwtsMRQ6kcJW1d_i7jCOtQoENnzxj-kVXnLXflJ0M0agYaGvL7IjSDA2LkKc0hataUAZ4JkN_aUB8Mg';
    const DER = 'foo';

    expect.assertions(1);
    try {
        JWS.verifyJWT(JWT, DER, { alg: ['RS256'] });
    } catch (error) {
        expect(error).toBeDefined();
    }
});

test('should parse JWT with b64utos and readSafeJSONString', () => {
    const JWT =
        'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0ZW5hbnRJZCI6IjVlNmY0MmZlZmM4MTU5MDAxYmIyMTlmMCIsImFwcElkIjoiNWU2ZjQyZmZmYzgxNTkwMDFiYjIxOWYyIiwicGxhdGZvcm1OYW1lIjoiZmlyZXR2Iiwic2RrVmVyc2lvbiI6InYxIiwic2RrTmFtZSI6ImpzLXNkay15b3VpIiwiZW5hYmxlZCI6dHJ1ZSwiaG9zdCI6Imh0dHBzOi8veGFhZi1haW8udGx2LWRldm9wcy5jb20vYWR2ZXJ0aXNlLTU5ODgiLCJwcml2aWxlZ2VUeXBlIjoidGVzdGVyIiwiZW52aXJvbm1lbnQiOiJ0bHYtYWR2ZXJ0aXNlLTU5ODgiLCJpYXQiOjE1ODk4MDY5NTYsImlzcyI6IkFUJlQiLCJzdWIiOiJBcGlLZXkifQ.UayyxQDOJJRtB_udj1NDjjZvT8FEfdKu95BzLXRElmpxb8UL8nQCezGGUs12q91Wpp6B5pAQ3704gehLIgXZQztkLu084Gg4NWtkQjv8wqrlK3f5Yl5BslvepnnLnHEDjrSA6o0FYHSGnnHZ10irYG7TrtJ59cV1OYxgQk8dHpzEoe_CBv7rwHGvGjJr5WCYEYaGSGNUZMKNOUN63jpX-3HqXGeIMIY9XjmZaFIJ0S95bC2nQRfnQmZ5MRequn44f6PNYdCDwtsMRQ6kcJW1d_i7jCOtQoENnzxj-kVXnLXflJ0M0agYaGvL7IjSDA2LkKc0hataUAZ4JkN_aUB8Mg';
    const [header, claim] = JWT.split('.');
    const uHeader = b64utos(header);
    const uClaim = b64utos(claim);

    const isSafe = JWS.isSafeJSONString(uHeader);
    const pHeader = JWS.readSafeJSONString(uHeader);
    const pClaim = JWS.readSafeJSONString(uClaim);

    expect(isSafe).toBe(1);
    expect(pHeader['alg']).toBe('RS256');
    expect(pClaim['platformName']).toBe('firetv');
});

test('should parse JWT with parse', () => {
    const JWT =
        'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0ZW5hbnRJZCI6IjVlNmY0MmZlZmM4MTU5MDAxYmIyMTlmMCIsImFwcElkIjoiNWU2ZjQyZmZmYzgxNTkwMDFiYjIxOWYyIiwicGxhdGZvcm1OYW1lIjoiZmlyZXR2Iiwic2RrVmVyc2lvbiI6InYxIiwic2RrTmFtZSI6ImpzLXNkay15b3VpIiwiZW5hYmxlZCI6dHJ1ZSwiaG9zdCI6Imh0dHBzOi8veGFhZi1haW8udGx2LWRldm9wcy5jb20vYWR2ZXJ0aXNlLTU5ODgiLCJwcml2aWxlZ2VUeXBlIjoidGVzdGVyIiwiZW52aXJvbm1lbnQiOiJ0bHYtYWR2ZXJ0aXNlLTU5ODgiLCJpYXQiOjE1ODk4MDY5NTYsImlzcyI6IkFUJlQiLCJzdWIiOiJBcGlLZXkifQ.UayyxQDOJJRtB_udj1NDjjZvT8FEfdKu95BzLXRElmpxb8UL8nQCezGGUs12q91Wpp6B5pAQ3704gehLIgXZQztkLu084Gg4NWtkQjv8wqrlK3f5Yl5BslvepnnLnHEDjrSA6o0FYHSGnnHZ10irYG7TrtJ59cV1OYxgQk8dHpzEoe_CBv7rwHGvGjJr5WCYEYaGSGNUZMKNOUN63jpX-3HqXGeIMIY9XjmZaFIJ0S95bC2nQRfnQmZ5MRequn44f6PNYdCDwtsMRQ6kcJW1d_i7jCOtQoENnzxj-kVXnLXflJ0M0agYaGvL7IjSDA2LkKc0hataUAZ4JkN_aUB8Mg';
    const parsed = JWS.parse(JWT);

    expect(parsed.headerObj['alg']).toBe('RS256');
    expect(parsed.payloadObj['platformName']).toBe('firetv');
});

test('should parse base64 into DER', () => {
    const LAL_PK =
        'LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FROEFNSUlCQ2dLQ0FRRUFnN0N5bHNZWWQ3Yll4ZkpIcWYzeQpzeGk1dlNCQzYyZjduWmpJc2dSdGQ4VGtGOWQwM1UvK2hlUDc2ODlEWlg4WWl1d2xHa0Z5Z085WnQycE9kekpnCmRtT09maDIya01rMHFHZ0tOUkVWZVN4L0RpWTMrZXBJUnRtY0FwZGxaVG5MK0gwMUtkc2dmS1VqNFVKTkNZdjUKL2g4a09zOHVCOEhNNE41dWFmNWxUS0NBbDlyR09XOWxmeHZjdGFpTTZTdmNkZnorN2NQSDY0SWN6cS9OL0drMApQTlVVenRMWENPOVlQSFZEVW0yMW05MHpFa2JWTW91aFI4aTJNbE5Zb24wbWE4UU01VXdnRmYrb0lqQ3hvZTVaCmt6RzY0cjhoUVBLSU5KS2NhMEVTMkxCNGZRakI3ZWl1ZmxXM2FlUjhUa25CS05WejBiTXVKb0ZPUURjOW1hSHIKM1FJREFRQUIKLS0tLS1FTkQgUFVCTElDIEtFWS0tLS0t';
    const DER_parsed = b64utos(LAL_PK);
    const DER_original = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAg7CylsYYd7bYxfJHqf3y
sxi5vSBC62f7nZjIsgRtd8TkF9d03U/+heP7689DZX8YiuwlGkFygO9Zt2pOdzJg
dmOOfh22kMk0qGgKNREVeSx/DiY3+epIRtmcApdlZTnL+H01KdsgfKUj4UJNCYv5
/h8kOs8uB8HM4N5uaf5lTKCAl9rGOW9lfxvctaiM6Svcdfz+7cPH64Iczq/N/Gk0
PNUUztLXCO9YPHVDUm21m90zEkbVMouhR8i2MlNYon0ma8QM5UwgFf+oIjCxoe5Z
kzG64r8hQPKINJKca0ES2LB4fQjB7eiuflW3aeR8TknBKNVz0bMuJoFOQDc9maHr
3QIDAQAB
-----END PUBLIC KEY-----`;

    expect(DER_parsed).toEqual(DER_original);
});

test('return false for api key validation when enviroment is empty', () => {
    const isApiKeyValid = service.verify('aaa', '');
    expect(isApiKeyValid).toEqual(false);
});

test('return true for valid api key with correct enviroment', () => {
    const isApiKeyValid = service.verify(
        'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0ZW5hbnRJZCI6IjVkMzQ4MzBiNGM4NzcxMDAxMjJhYTY5OSIsImFwcElkIjoiNWQzNDgzMGI0Yzg3NzEwMDEyMmFhNjlhIiwicGxhdGZvcm1OYW1lIjoiZmlyZXR2Iiwic2RrVmVyc2lvbiI6InYxIiwic2RrTmFtZSI6ImFuZHJvaWR0diIsImVudmlyb25tZW50IjoidGx2LXRlc3QiLCJpYXQiOjE1NjM3MjI1MDgsImlzcyI6IkFUJlQiLCJzdWIiOiJBcGlLZXkifQ.FlveU39PtMrUIS6cENIk8xY-qgSPmGBK4Ir4COgfTQIoOat4wS73xl9sSTLm3zG1gedqGDIXYKT_lV43ASvVP5e1fpXdeWEsHvNyh163O-mbhI12_UvWl7JvBAhzFVlxflbHgWCdoyfN7Px1jx469RfzVELNck5dinYwEMyIJThDEc_TZ0DQogwTncHCmMfBtmANAc7LhHPtTOL0xLTUs5A2WtI1fD_jVsMAcM9Hdj1W6KFDIH2OXjfYmMtKkLQMpVl668Jx8K5D3WqHJHtdjHJlnLzyq31p6dMUV4TeRq5whLcE_e_ptkYVJ6KbOMJ7Kzs3eOBgsMPu16JNmMclgA',
        'tlv-test'
    );
    expect(isApiKeyValid).toEqual(true);
});

test('return false for invalid api key', () => {
    const isApiKeyValid = service.verify(
        'eyJhbGciOiJSUzI1NiIsInR5cCI6Ik11VCJ9.eyJ0ZW5hbnRJZCI00jVkMzQ4MzBi77GM4NzMDAxMjJhYTY5OSIsImFwcElkIjoiNWQzNDgzMGI0Yzg3NzEwMDEyMmFhNjlhIiwicGxhdGZvcm1OYW1lIjoiZmlyZXR2Iiwic2RrVmVyc2lvbiI6InYxIiwic2RrTmFtZSI6ImFuZHJvaWR0diIsImVudmlyb25tZW50IjoidGx2LXRlc3QiLCJpYXQiOjE1NjM3MjI1MDgsImlzcyI6IkFUJlQiLCJzdWIiOiJBcGlLZXkifQ.FlveU39PtMrUIS6cENIk8xY-qgSPmGBK4Ir4COgfTQIoOat4wS73xl9sSTLm3zG1gedqGDIXYKT_lV43ASvVP5e1fpXdeWEsHvNyh163O-mbhI12_UvWl7JvBAhzFVlxflbHgWCdoyfN7Px1jx469RfzVELNck5dinYwEMyIJThDEc_TZ0DQogwTncHCmMfBtmANAc7LhHPtTOL0xLTUs5A2WtI1fD_jVsMAcM9Hdj1W6KFDIH2OXjfYmMtKkLQMpVl668Jx8K5D3WqHJHtdjHJlnLzyq31p6dMUV4TeRq5whLcE_e_ptkYVJ6KbOMJ7Kzs3eOBgsMPu16JNmMclgA',
        'tlv-advertise-somecampaign'
    );
    expect(isApiKeyValid).toEqual(false);
});

test('return false for api key validation when environment not empty and api key empty', () => {
    const isApiKeyValid = service.verify('', 'aaa');
    expect(isApiKeyValid).toEqual(false);
});

test('decide method should parse JWT with parse', () => {
    const JWT =
        'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0ZW5hbnRJZCI6IjVlNmY0MmZlZmM4MTU5MDAxYmIyMTlmMCIsImFwcElkIjoiNWU2ZjQyZmZmYzgxNTkwMDFiYjIxOWYyIiwicGxhdGZvcm1OYW1lIjoiZmlyZXR2Iiwic2RrVmVyc2lvbiI6InYxIiwic2RrTmFtZSI6ImpzLXNkay15b3VpIiwiZW5hYmxlZCI6dHJ1ZSwiaG9zdCI6Imh0dHBzOi8veGFhZi1haW8udGx2LWRldm9wcy5jb20vYWR2ZXJ0aXNlLTU5ODgiLCJwcml2aWxlZ2VUeXBlIjoidGVzdGVyIiwiZW52aXJvbm1lbnQiOiJ0bHYtYWR2ZXJ0aXNlLTU5ODgiLCJpYXQiOjE1ODk4MDY5NTYsImlzcyI6IkFUJlQiLCJzdWIiOiJBcGlLZXkifQ.UayyxQDOJJRtB_udj1NDjjZvT8FEfdKu95BzLXRElmpxb8UL8nQCezGGUs12q91Wpp6B5pAQ3704gehLIgXZQztkLu084Gg4NWtkQjv8wqrlK3f5Yl5BslvepnnLnHEDjrSA6o0FYHSGnnHZ10irYG7TrtJ59cV1OYxgQk8dHpzEoe_CBv7rwHGvGjJr5WCYEYaGSGNUZMKNOUN63jpX-3HqXGeIMIY9XjmZaFIJ0S95bC2nQRfnQmZ5MRequn44f6PNYdCDwtsMRQ6kcJW1d_i7jCOtQoENnzxj-kVXnLXflJ0M0agYaGvL7IjSDA2LkKc0hataUAZ4JkN_aUB8Mg';
    const parsed = service.decode(JWT);
    expect(parsed['platformName']).toBe('firetv');
});
