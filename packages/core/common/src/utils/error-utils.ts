import {
    ErrorDomain,
    ErrorEndPoint,
    ErrorSubDomain,
    RecoveryAction,
    XaafErrorCode,
    ErrorCode,
    XaafError,
    ReportDefaultValue,
    ErrorProperty,
    ErrorProperties
} from '../models';

export class ErrorUtils {
    static xaafError(
        errorCode: XaafErrorCode,
        comment: string,
        errorSubDomain?: ErrorSubDomain,
        errorEndPoint?: ErrorEndPoint,
        recoveryAction?: RecoveryAction,
        isErrorRecoverable?: boolean
    ): XaafError {
        const { didTryRecovery, isRecoverable, recoveryActionTaken, errorProperty } = ErrorUtils.handleRecovery(
            errorCode,
            recoveryAction,
            isErrorRecoverable
        );

        const message = errorProperty.message ?? '';
        const code = Number.parseInt(errorCode);
        const httpErrorCode = ErrorUtils.buildHttpErrorCode(code);

        return {
            // if didTryRecovery is CIRCUIT_BREAK, don't report recoveryActionTaken
            ...(didTryRecovery === RecoveryAction.CircuitBreak ? {} : { recoveryActionTaken }),
            errorCode,
            message,
            comment,
            httpErrorCode,
            isRecoverable,
            didTryRecovery,
            errorDesc: `${errorCode}: ${message}. ${comment}`,
            loopRetry: false,
            errorSubDomain,
            errorEndPoint
        };
    }

    static httpError = (
        errorCode: XaafErrorCode,
        comment: string,
        errorSubDomain?: ErrorSubDomain,
        errorEndPoint?: string,
        recoveryActionTaken?: RecoveryAction,
        isRecoverable?: boolean
    ): XaafError => ({
        ...ErrorUtils.xaafError(errorCode, comment, errorSubDomain, errorEndPoint, recoveryActionTaken, isRecoverable),
        errorEndPoint,
        errorDomain: ErrorDomain.Http
    });

    static sdkError = (
        errorCode: XaafErrorCode,
        comment: string,
        errorSubDomain?: ErrorSubDomain,
        errorEndPoint?: ErrorEndPoint,
        recoveryActionTaken?: RecoveryAction,
        isRecoverable?: boolean
    ): XaafError => ({
        ...ErrorUtils.xaafError(errorCode, comment, errorSubDomain, errorEndPoint, recoveryActionTaken, isRecoverable),
        errorDomain: ErrorDomain.SDK
    });

    static exAdError = (
        errorCode: XaafErrorCode,
        comment: string,
        errorSubDomain?: ErrorSubDomain,
        errorEndPoint?: ErrorEndPoint,
        recoveryActionTaken?: RecoveryAction,
        isRecoverable?: boolean,
    ): XaafError => ({
        ...ErrorUtils.xaafError(errorCode, comment, errorSubDomain, errorEndPoint, recoveryActionTaken, isRecoverable),
        errorDomain: ErrorDomain.ExAd,
    });

    static createGeneralError = (errorEndPoint: string): XaafError =>
        ErrorUtils.httpError(ErrorCode.GeneralError, 'General Error in Login', ErrorSubDomain.Auth, errorEndPoint);

    static finalGeneralErrorDecorator(error: XaafError): void {
        // TODO: this isn't a decorator
        error.didTryRecovery = RecoveryAction.Retry;
        error.isRecoverable = false;
        error.recoveryActionTaken = RecoveryAction.None;
    }

    static buildHttpErrorCode = (code: number) => {
        return code > 399 && code < 600 ? code.toString() : ReportDefaultValue.NP;
    };

    static handleRecovery = (
        errorCode: XaafErrorCode,
        recoveryAction?: RecoveryAction,
        isErrorRecoverable?: boolean
    ) => {
        const undefinedErrorMessage = 'Undefined Error';
        const errorProperty: ErrorProperty = ErrorProperties.get(errorCode) || { message: undefinedErrorMessage };

        let recoveryActionTaken: RecoveryAction =
            recoveryAction ?? errorProperty.recoveryActionTaken ?? RecoveryAction.None;

        const isRecoverable: boolean = isErrorRecoverable ?? recoveryActionTaken !== RecoveryAction.CircuitBreak;

        let didTryRecovery = RecoveryAction.None;
        if (recoveryActionTaken === RecoveryAction.CircuitBreak) {
            recoveryActionTaken = RecoveryAction.None;
            didTryRecovery = RecoveryAction.CircuitBreak;
        }

        if (
            errorProperty.message !== undefinedErrorMessage &&
            errorProperty.recoveryActionTaken === RecoveryAction.Retry &&
            !isRecoverable
        ) {
            didTryRecovery = RecoveryAction.Retry;
        }

        return {
            didTryRecovery,
            isRecoverable,
            recoveryActionTaken,
            errorProperty
        };
    };
}
