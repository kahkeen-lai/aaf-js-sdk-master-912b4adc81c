/* eslint-disable @typescript-eslint/no-var-requires */
import { HostRequestCommand } from './host-request-command';
import '../mock/mock';
const opportunityWithHostRequestCommand = require('../mock/expectations/SEND_REQUEST_TO_HOST.json');

describe('HostRequestCommand functions', () => {
    it('test HostRequestCommand execution function', () => {
        const hostRequestCommandUnderTest = new HostRequestCommand(opportunityWithHostRequestCommand.commands[0]);
        const commandModel = hostRequestCommandUnderTest.getCommandModel();
        expect(commandModel.data['type']).toEqual('recordContent');
        expect(commandModel.data['mandatory']).toBeTruthy();
        expect(commandModel.data['arguments']).toEqual({ contentTmsId: 1234 });
        expect(commandModel.data['timeout_ms']).toEqual(3000);
        expect(commandModel.executionTriggers[0]['trigger']).toEqual('STATE_STARTED');
        // @ts-ignore
        const commandEventCreator = hostRequestCommandUnderTest._commandEventCreator;
        // @ts-ignore
        jest.spyOn(hostRequestCommandUnderTest, '_notify');
        jest.spyOn(commandEventCreator, 'createHostRequestEvent');
        hostRequestCommandUnderTest.execute();
        // @ts-ignore
        expect(hostRequestCommandUnderTest._notify).toBeCalled();
        expect(commandEventCreator).toBeDefined();
        expect(commandEventCreator.createHostRequestEvent).toBeCalledWith(hostRequestCommandUnderTest);
    });
});
