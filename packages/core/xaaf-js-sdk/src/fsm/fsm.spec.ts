import { FSM } from './fsm';
import { TriggerType } from './trigger';
import { State, StateType } from './state';

describe('FSM states tests', () => {
    let fsm: FSM;

    const stateList = [
        State.STATE_CREATED,
        State.STATE_INITIATING,
        State.STATE_LOADED,
        State.STATE_STARTING,
        State.STATE_STARTED,
        State.STATE_PLAYING,
        State.STATE_PAUSING,
        State.STATE_PAUSED,
        State.STATE_RESUMING,
        State.STATE_RESUMED,
        State.STATE_INTERACTION,
        State.STATE_STOPPING,
        State.STATE_STOPPED,
        State.STATE_ERROR,
        State.STATE_TERMINATED
    ];

    beforeEach(() => {
        fsm = new FSM();
    });

    function subscribeToFsmAndExpectStateNotToBeChanged(expectedState: StateType): void {
        fsm.subscribe((state) => {
            if (state.changed === undefined) {
                return;
            }
            if (state.value === expectedState && state.changed) {
                fail('Cannot change state to ' + expectedState);
            }
        });
    }

    function jumpToSourceState(sourceState: StateType): void {
        fsm.start();
        if (sourceState !== State.STATE_CREATED) {
            for (const state of stateList) {
                fsm.next(state as TriggerType);
                if (state === sourceState) {
                    break;
                }
            }
        }
    }

    function verifyStateIsNotAllowedToBeNext(targetState: StateType): void {
        subscribeToFsmAndExpectStateNotToBeChanged(targetState);

        fsm.next(targetState);
    }

    function testToMoveFromStateToOtherStateThatShouldBeNegative(sourceState: StateType, targetState: StateType): void {
        jumpToSourceState(sourceState);
        verifyStateIsNotAllowedToBeNext(targetState);
    }

    function runTestOnAllParameters(sourceState: StateType, testParameters: StateType[]): void {
        testParameters.forEach((parameter) => {
            it('Move to ' + parameter + ', should not change state', () => {
                testToMoveFromStateToOtherStateThatShouldBeNegative(sourceState, parameter);
            });
        });
    }

    function removeAllowedStatesFromAllStates(allowedStates: string[]): StateType[] {
        return stateList.filter((obj) => allowedStates.indexOf(obj) === -1) as StateType[];
    }

    describe('STATE_CREATED tests', () => {
        const testParameters = removeAllowedStatesFromAllStates([
            State.STATE_INITIATING,
            State.STATE_LOADED,
            State.STATE_ERROR,
            State.STATE_INTERACTION,
            State.STATE_STOPPING
        ]);

        runTestOnAllParameters(State.STATE_CREATED as StateType, testParameters);
    });

    describe('STATE_INITIATING tests', () => {
        const testParameters = removeAllowedStatesFromAllStates([
            State.STATE_INITIATING,
            State.STATE_LOADED,
            State.STATE_STARTING,
            State.STATE_ERROR,
            State.STATE_INTERACTION,
            State.STATE_STOPPING
        ]);

        runTestOnAllParameters(State.STATE_INITIATING as StateType, testParameters);
    });

    describe('STATE_LOADED tests', () => {
        const testParameters = removeAllowedStatesFromAllStates([
            State.STATE_LOADED,
            State.STATE_STARTING,
            State.STATE_ERROR,
            State.STATE_INTERACTION,
            State.STATE_STOPPING
        ]);

        runTestOnAllParameters(State.STATE_LOADED as StateType, testParameters);
    });

    describe('STATE_STARTING tests', () => {
        const testParameters = removeAllowedStatesFromAllStates([
            State.STATE_STARTING,
            State.STATE_STARTED,
            State.STATE_ERROR,
            State.STATE_INTERACTION,
            State.STATE_STOPPING
        ]);

        runTestOnAllParameters(State.STATE_STARTING as StateType, testParameters);
    });

    describe('STATE_STARTED tests', () => {
        const testParameters = removeAllowedStatesFromAllStates([
            State.STATE_STARTED,
            State.STATE_PLAYING,
            State.STATE_ERROR,
            State.STATE_INTERACTION,
            State.STATE_STOPPING
        ]);

        runTestOnAllParameters(State.STATE_STARTED as StateType, testParameters);
    });

    describe('STATE_PLAYING tests', () => {
        const testParameters = removeAllowedStatesFromAllStates([
            State.STATE_PLAYING,
            State.STATE_PAUSING,
            State.STATE_ERROR,
            State.STATE_INTERACTION,
            State.STATE_STOPPING
        ]);

        runTestOnAllParameters(State.STATE_PLAYING as StateType, testParameters);
    });

    describe('STATE_PAUSING tests', () => {
        const testParameters = removeAllowedStatesFromAllStates([
            State.STATE_PAUSING,
            State.STATE_PAUSED,
            State.STATE_ERROR,
            State.STATE_INTERACTION,
            State.STATE_STOPPING
        ]);

        runTestOnAllParameters(State.STATE_PAUSING as StateType, testParameters);
    });

    describe('STATE_PAUSED tests', () => {
        const testParameters = removeAllowedStatesFromAllStates([
            State.STATE_PAUSED,
            State.STATE_RESUMING,
            State.STATE_ERROR,
            State.STATE_INTERACTION,
            State.STATE_STOPPING
        ]);

        runTestOnAllParameters(State.STATE_PAUSED as StateType, testParameters);
    });

    describe('STATE_RESUMING tests', () => {
        const testParameters = removeAllowedStatesFromAllStates([
            State.STATE_RESUMING,
            State.STATE_RESUMED,
            State.STATE_ERROR,
            State.STATE_INTERACTION,
            State.STATE_STOPPING
        ]);

        runTestOnAllParameters(State.STATE_RESUMING as StateType, testParameters);
    });

    describe('STATE_RESUMED tests', () => {
        const testParameters = removeAllowedStatesFromAllStates([
            State.STATE_RESUMED,
            State.STATE_PLAYING,
            State.STATE_ERROR,
            State.STATE_INTERACTION,
            State.STATE_STOPPING
        ]);

        runTestOnAllParameters(State.STATE_RESUMED as StateType, testParameters);
    });

    describe('STATE_INTERACTION tests', () => {
        const testParameters = removeAllowedStatesFromAllStates([
            State.STATE_INTERACTION,
            State.STATE_ERROR,
            State.STATE_STOPPING
        ]);

        runTestOnAllParameters(State.STATE_INTERACTION as StateType, testParameters);
    });

    describe('STATE_STOPPING tests', () => {
        const testParameters = removeAllowedStatesFromAllStates([
            State.STATE_STOPPED,
            State.STATE_ERROR,
            State.STATE_STOPPING
        ]);

        runTestOnAllParameters(State.STATE_STOPPING as StateType, testParameters);
    });

    describe('STATE_STOPPED tests', () => {
        const testParameters = removeAllowedStatesFromAllStates([
            State.STATE_STOPPED,
            State.STATE_ERROR,
            State.STATE_TERMINATED
        ]);

        runTestOnAllParameters(State.STATE_STOPPED as StateType, testParameters);
    });

    describe('STATE_ERROR tests', () => {
        const testParameters = removeAllowedStatesFromAllStates([State.STATE_ERROR, State.STATE_TERMINATED]);

        runTestOnAllParameters(State.STATE_ERROR as StateType, testParameters);
    });

    describe('STATE_TERMINATED tests', () => {
        const testParameters = removeAllowedStatesFromAllStates([State.STATE_TERMINATED]);

        runTestOnAllParameters(State.STATE_TERMINATED as StateType, testParameters);
    });
});
