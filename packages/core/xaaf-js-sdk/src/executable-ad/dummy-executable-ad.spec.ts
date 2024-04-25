import { resetMocks } from '../mock/mock';
import * as Core from '@xaaf/common';
import { DummyExecutableAd } from './dummy-executable-ad';
import { ConfigService, LoginService } from '../services';
import { OpportunityInfo } from '../xaaf-js-sdk';

describe('DummyExecutableAd functions', () => {
    let dummyExecutableAdUnderTest: DummyExecutableAd;
    let configServiceMock: ConfigService;
    let opportunityInfoMock: OpportunityInfo;
    beforeEach(() => {
        resetMocks();
        configServiceMock = Core.InjectionContainer.resolve<ConfigService>(Core.ContainerDef.configService);

        dummyExecutableAdUnderTest = new DummyExecutableAd(configServiceMock, opportunityInfoMock);
    });

    it('should be defined', () => {
        expect(dummyExecutableAdUnderTest).toBeDefined();
    });

    it('should fail to init', async () => {
        await dummyExecutableAdUnderTest.initAd();
        expect.assertions(1);
        expect(dummyExecutableAdUnderTest.currentState).toEqual('STATE_STOPPED');
    });

    it('dummyExecutableAdUnderTest is called by startAd func', async () => {
        const _setStoppingForDummyIsCalled = jest.spyOn(dummyExecutableAdUnderTest, 'setStoppingForDummy');
        dummyExecutableAdUnderTest.startAd();
        expect(_setStoppingForDummyIsCalled).toBeCalled();
    });

    it('dummyExecutableAdUnderTest is called by stopAd func', async () => {
        const _setStoppingForDummyIsCalled = jest.spyOn(dummyExecutableAdUnderTest, 'setStoppingForDummy');
        dummyExecutableAdUnderTest.stopAd();
        expect(_setStoppingForDummyIsCalled).toBeCalled();
    });

    it('dummyExecutableAdUnderTest is called by pauseAd func', async () => {
        const _setStoppingForDummyIsCalled = jest.spyOn(dummyExecutableAdUnderTest, 'setStoppingForDummy');
        dummyExecutableAdUnderTest.pauseAd();
        expect(_setStoppingForDummyIsCalled).toBeCalled();
    });

    it('dummyExecutableAdUnderTest is called by resumeAd func', async () => {
        const _setStoppingForDummyIsCalled = jest.spyOn(dummyExecutableAdUnderTest, 'setStoppingForDummy');
        dummyExecutableAdUnderTest.resumeAd();
        expect(_setStoppingForDummyIsCalled).toBeCalled();
    });

    it('check reason NOT_LOGGED_IN', () => {
        LoginService.getInstance().isLoggedIn = false;
        dummyExecutableAdUnderTest.setStoppingForDummy();
        expect(dummyExecutableAdUnderTest['_stoppingReason']).toEqual(Core.AdEventReason.NOT_LOGGED_IN);
    });
    it('expanding the coverage by testing the private method _setDummyCommand// consider refatoring', () => {
        LoginService.getInstance().isLoggedIn = false;
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        dummyExecutableAdUnderTest._setDummyCommand();
        expect(dummyExecutableAdUnderTest['_hostStoppingReason']).toEqual('NA');
    });
});
