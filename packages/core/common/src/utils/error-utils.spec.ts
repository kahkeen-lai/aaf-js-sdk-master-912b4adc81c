import { ErrorUtils } from './error-utils';
import {
    ErrorCode,
    ErrorDomain,
    ErrorSubDomain,
    RecoveryAction,
    ReportDefaultValue,
    XaafError,
    XaafErrorCode
} from '../models';

describe('error service helper functions', () => {
    it('general error function should return correct error object', () => {
        const error: XaafError = ErrorUtils.xaafError(ErrorCode.AuthenticationError, 'Foo');

        expect(error.comment).toBe('Foo');
        expect(error.errorCode).toBe('401-9000');
        expect(error.isRecoverable).toBe(false);
        expect(error.didTryRecovery).toBe(RecoveryAction.CircuitBreak);
        expect(error.recoveryActionTaken).toBeUndefined();
        expect(typeof error.message).toBe('string');
    });

    it('HTTP error function should return correct error object', () => {
        const error: XaafError = ErrorUtils.httpError(
            ErrorCode.AuthenticationError,
            'Foo',
            ErrorSubDomain.Xaaba,
            'http://example.com/'
        );
        expect(error.errorDomain).toBe(ErrorDomain.Http);
        expect(error.errorSubDomain).toBe(ErrorSubDomain.Xaaba);
        expect(error.httpErrorCode).toBe('401');
        expect(error.errorEndPoint).toBe('http://example.com/');
    });

    it('Final login decorator to change values of the error', () => {
        const xaafError = ErrorUtils.createGeneralError('LoginService::_createGeneralError');
        expect(xaafError.isRecoverable).toBe(true);
        expect(xaafError.didTryRecovery).toBe(RecoveryAction.None);
        expect(xaafError.recoveryActionTaken).toBe(RecoveryAction.Retry);
        ErrorUtils.finalGeneralErrorDecorator(xaafError);
        expect(xaafError.isRecoverable).toBe(false);
        expect(xaafError.didTryRecovery).toBe(RecoveryAction.Retry);
        expect(xaafError.recoveryActionTaken).toBe(RecoveryAction.None);
    });

    it('Undefined error function should return correct error object', () => {
        const error: XaafError = ErrorUtils.httpError(<XaafErrorCode>'1337', 'Foo');

        expect(error.errorCode).toBe('1337');
        expect(error.httpErrorCode).toBe(ReportDefaultValue.NP);
        expect(error.message).toBe('Undefined Error');
    });
});

describe('Test error components', () => {
    it('general error function should return correct error object', () => {
        const error: XaafError = ErrorUtils.xaafError(ErrorCode.AuthenticationError, 'Foo');

        expect(error.comment).toBe('Foo');
        expect(error.errorCode).toBe('401-9000');
        expect(error.isRecoverable).toBeFalsy();
        expect(error.didTryRecovery).toBe(RecoveryAction.CircuitBreak);
        expect(error.recoveryActionTaken).toBeUndefined();

        expect(typeof error.message).toBe('string');
    });
    it('HTTP error function should return correct error object', () => {
        const error: XaafError = ErrorUtils.httpError(
            ErrorCode.AuthenticationError,
            'Foo',
            ErrorSubDomain.Xaaba,
            'http://example.com/'
        );
        expect(error.errorDomain).toBe(ErrorDomain.Http);
        expect(error.errorSubDomain).toBe(ErrorSubDomain.Xaaba);
        expect(error.httpErrorCode).toBe('401');
        expect(error.errorEndPoint).toBe('http://example.com/');
    });
    it('Undefined error function should return correct error object', () => {
        const error: XaafError = ErrorUtils.httpError(<XaafErrorCode>'1337', 'Foo');

        expect(error.errorCode).toBe('1337');
        expect(error.httpErrorCode).toBe(ReportDefaultValue.NP);
        expect(error.message).toBe('Undefined Error');
    });
});
