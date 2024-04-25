/* eslint-disable @typescript-eslint/no-var-requires */
import { StopExperienceCommand } from './stop-experience-command';
import '../mock/mock';
const opportunityWithStopExperienceCommand = require('../mock/expectations/TIME_BASED_TRIGGERS.json');

describe('StopExperienceCommand functions', () => {
    it('test StopExperienceCommand execution function', () => {
        const stopExperienceCommandUnderTest = new StopExperienceCommand(
            opportunityWithStopExperienceCommand.commands[1]
        );
        const commandModel = stopExperienceCommandUnderTest.getCommandModel();
        expect(commandModel.data['reason']).toEqual('self-dismiss');
        expect(commandModel.data['notifyToHost']).toBeTruthy();
        expect(commandModel.executionTriggers[0].data['delay']).toEqual(4000);
        const reason = 'self-dismiss';
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const notifyToHost = true;
        // @ts-ignore
        const commandEventCreator = stopExperienceCommandUnderTest._commandEventCreator;
        // @ts-ignore
        jest.spyOn(stopExperienceCommandUnderTest, '_notify');
        jest.spyOn(commandEventCreator, 'createStopExperienceEvent');
        stopExperienceCommandUnderTest.execute();
        // @ts-ignore
        expect(stopExperienceCommandUnderTest._notify).toBeCalled();
        expect(commandEventCreator).toBeDefined();
        expect(commandEventCreator.createStopExperienceEvent).toBeCalledWith(reason, notifyToHost);
    });
});
