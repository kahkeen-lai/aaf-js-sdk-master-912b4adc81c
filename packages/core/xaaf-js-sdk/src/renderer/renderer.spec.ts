/* eslint-disable @typescript-eslint/no-var-requires */ import '../mock/mock';
import { Renderer } from './renderer';
import { Command } from '../executable-ad/commands';
import { Xip } from '@xaaf/common';
import { XaafElement } from '../executable-ad/elements';
import { EmptyCommand } from './empty-command';
import { ShowVideoCommand } from './show-video-command';
import { TriggerType } from '../fsm/trigger';
import { ReportService } from '../services';
import { ShowImageCommand } from './show-image-command';
import { ReportCommand } from './report-command';

describe('Renderer functions', () => {
    it('request create command SHOW_VIDEO gets show video command', async () => {
        const rendererAtTest = new Renderer();
        const opportunity: Xip = require('../mock/expectations/SHOW_VIDEO.json');
        const res = rendererAtTest.createCommand(opportunity.commands[0]);
        expect(res).toBeInstanceOf(ShowVideoCommand);
    });
    it('request create command SHOW_IMAGE gets show image command', async () => {
        const rendererAtTest = new Renderer();
        const opportunity: Xip = require('../mock/expectations/SHOW_IMAGE.json');
        const res = rendererAtTest.createCommand(opportunity.commands[0]);
        expect(res).toBeInstanceOf(ShowImageCommand);
    });
    it('request create command REPORT_COMMAND gets report command', async () => {
        const rendererAtTest = new Renderer();
        const opportunity: Xip = require('../mock/expectations/REPORT_COMMAND.json');
        const res = rendererAtTest.createCommand(opportunity.commands[0]);
        expect(res).toBeInstanceOf(ReportCommand);
    });
    it('request create command with something else gets an empty command that is alive', async () => {
        const rendererAtTest = new Renderer();
        const opportunity: Xip = require('../mock/expectations/BROKEN_COMMAND_NAME_FOR_TESTS.json');
        const reportMock = jest.spyOn(ReportService.getInstance(), 'reportError');
        const res: Command = rendererAtTest.createCommand(opportunity.commands[0]);
        let xel: XaafElement;
        const _stateInstanceHistory: Set<TriggerType> = new Set();
        _stateInstanceHistory.add('STATE_STARTED');
        res.execute(xel, 'STATE_STARTED', _stateInstanceHistory);
        res.init(xel);
        res.stop();
        expect(res).toBeInstanceOf(EmptyCommand);
        expect(reportMock).toBeCalled();
    });
});
