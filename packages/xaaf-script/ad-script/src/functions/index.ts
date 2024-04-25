/* eslint-disable @typescript-eslint/no-var-requires */
import $print from './function.print';
import $set from './function.set';
import $get from './function.get';
import $getData from './function.get-data';
import $databind from './function.databind';
import $replace from './function.replace';
import $choose from './function.choose';
import $condition from './function.condition';
import $fireTrigger from './function.fire-trigger';

export const AllFunctions = {
    $set,
    $get,
    $getData,
    $databind,
    $replace,
    $choose,
    $condition,
    $fireTrigger,
    $print
};

export * from './function.get-data';
