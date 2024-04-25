export const hostStoppingReason = 'HOST_STOPPING_REASON';

export enum ExpectedFieldValue {
  GreaterThanOrEqual_0 = 1,
  GreaterThan_0,
  GreaterThanOrEqual_Previous,
  ToBeCalculated,
  AsInOpportunityResponse,
  AsInHostAdInitParams,
  AsInInitAdInfo
}

export interface ExpectedAdLifecycleEventData {
  name: string;
  clientTime: number;
  hostAdInitParams: number | undefined;
  expId: number | undefined;
  projectBuildNumber: number | undefined;
  projectId: number | undefined;
  lastAdLifeCycleEventName: string;
  timeSinceLastLifeCycleEvent: number;
  hostAdCreate: number | undefined;
  timeSinceAdCreatedEvent: number | undefined;
  hostAdInit: number | undefined;
  hostAdStart: number | undefined;
  timeSinceStarted: number | undefined;
  hostAdStop: number | undefined;
  adSessionParam: number | undefined;
  adSessionGlobalParam: number;
  hostStoppingReason: string;
}

export function getExpectedNRAdLifecycleEventsData(): ExpectedAdLifecycleEventData[] {
  return [
    {
      name: 'HOST_AD_CREATE',
      clientTime: ExpectedFieldValue.GreaterThan_0,
      hostAdInitParams: undefined,
      expId: undefined,
      projectBuildNumber: undefined,
      projectId: undefined,
      lastAdLifeCycleEventName: 'NA',
      timeSinceLastLifeCycleEvent: 0,
      hostAdCreate: 0,
      timeSinceAdCreatedEvent: undefined,
      hostAdInit: undefined,
      hostAdStart: undefined,
      timeSinceStarted: undefined,
      hostAdStop: undefined,
      adSessionParam: undefined,
      adSessionGlobalParam: ExpectedFieldValue.AsInInitAdInfo,
      hostStoppingReason: undefined
    },
    {
      name: 'AD_CREATED',
      clientTime: ExpectedFieldValue.GreaterThanOrEqual_Previous,
      hostAdInitParams: undefined,
      expId: undefined,
      projectBuildNumber: undefined,
      projectId: undefined,
      lastAdLifeCycleEventName: 'HOST_AD_CREATE',
      timeSinceLastLifeCycleEvent: ExpectedFieldValue.GreaterThanOrEqual_0,
      hostAdCreate: ExpectedFieldValue.ToBeCalculated,
      timeSinceAdCreatedEvent: 0,
      hostAdInit: undefined,
      hostAdStart: undefined,
      timeSinceStarted: undefined,
      hostAdStop: undefined,
      adSessionParam: undefined,
      adSessionGlobalParam: ExpectedFieldValue.AsInInitAdInfo,
      hostStoppingReason: undefined
    },
    {
      name: 'HOST_AD_INIT',
      clientTime: ExpectedFieldValue.GreaterThanOrEqual_Previous,
      hostAdInitParams: undefined,
      expId: undefined,
      projectBuildNumber: undefined,
      projectId: undefined,
      lastAdLifeCycleEventName: 'AD_CREATED',
      timeSinceLastLifeCycleEvent: ExpectedFieldValue.GreaterThanOrEqual_0,
      hostAdCreate: ExpectedFieldValue.ToBeCalculated,
      timeSinceAdCreatedEvent: ExpectedFieldValue.ToBeCalculated,
      hostAdInit: 0,
      hostAdStart: undefined,
      timeSinceStarted: undefined,
      hostAdStop: undefined,
      adSessionParam: undefined,
      adSessionGlobalParam: ExpectedFieldValue.AsInInitAdInfo,
      hostStoppingReason: undefined
    },
    {
      name: 'AD_INIT',
      clientTime: ExpectedFieldValue.GreaterThanOrEqual_Previous,
      hostAdInitParams: ExpectedFieldValue.AsInHostAdInitParams,
      expId: undefined,
      projectBuildNumber: undefined,
      projectId: undefined,
      lastAdLifeCycleEventName: 'HOST_AD_INIT',
      timeSinceLastLifeCycleEvent: ExpectedFieldValue.GreaterThanOrEqual_0,
      hostAdCreate: ExpectedFieldValue.ToBeCalculated,
      timeSinceAdCreatedEvent: ExpectedFieldValue.ToBeCalculated,
      hostAdInit: ExpectedFieldValue.ToBeCalculated,
      hostAdStart: undefined,
      timeSinceStarted: undefined,
      hostAdStop: undefined,
      adSessionParam: ExpectedFieldValue.AsInInitAdInfo,
      adSessionGlobalParam: ExpectedFieldValue.AsInInitAdInfo,
      hostStoppingReason: undefined
    },
    {
      name: 'AD_LOADED',
      clientTime: ExpectedFieldValue.GreaterThanOrEqual_Previous,
      hostAdInitParams: undefined,
      expId: ExpectedFieldValue.AsInOpportunityResponse,
      projectBuildNumber: ExpectedFieldValue.AsInOpportunityResponse,
      projectId: ExpectedFieldValue.AsInOpportunityResponse,
      lastAdLifeCycleEventName: 'AD_INIT',
      timeSinceLastLifeCycleEvent: ExpectedFieldValue.GreaterThanOrEqual_0,
      hostAdCreate: ExpectedFieldValue.ToBeCalculated,
      timeSinceAdCreatedEvent: ExpectedFieldValue.ToBeCalculated,
      hostAdInit: ExpectedFieldValue.ToBeCalculated,
      hostAdStart: undefined,
      timeSinceStarted: undefined,
      hostAdStop: undefined,
      adSessionParam: ExpectedFieldValue.AsInInitAdInfo,
      adSessionGlobalParam: ExpectedFieldValue.AsInInitAdInfo,
      hostStoppingReason: undefined
    },
    {
      name: 'HOST_AD_START',
      clientTime: ExpectedFieldValue.GreaterThanOrEqual_Previous,
      hostAdInitParams: undefined,
      expId: ExpectedFieldValue.AsInOpportunityResponse,
      projectBuildNumber: ExpectedFieldValue.AsInOpportunityResponse,
      projectId: ExpectedFieldValue.AsInOpportunityResponse,
      lastAdLifeCycleEventName: 'AD_LOADED',
      timeSinceLastLifeCycleEvent: ExpectedFieldValue.GreaterThanOrEqual_0,
      hostAdCreate: ExpectedFieldValue.ToBeCalculated,
      timeSinceAdCreatedEvent: ExpectedFieldValue.ToBeCalculated,
      hostAdInit: ExpectedFieldValue.ToBeCalculated,
      hostAdStart: 0,
      timeSinceStarted: undefined,
      hostAdStop: undefined,
      adSessionParam: ExpectedFieldValue.AsInInitAdInfo,
      adSessionGlobalParam: ExpectedFieldValue.AsInInitAdInfo,
      hostStoppingReason: undefined
    },
    {
      name: 'AD_STARTING',
      clientTime: ExpectedFieldValue.GreaterThanOrEqual_Previous,
      hostAdInitParams: undefined,
      expId: ExpectedFieldValue.AsInOpportunityResponse,
      projectBuildNumber: ExpectedFieldValue.AsInOpportunityResponse,
      projectId: ExpectedFieldValue.AsInOpportunityResponse,
      lastAdLifeCycleEventName: 'HOST_AD_START',
      timeSinceLastLifeCycleEvent: ExpectedFieldValue.GreaterThanOrEqual_0,
      hostAdCreate: ExpectedFieldValue.ToBeCalculated,
      timeSinceAdCreatedEvent: ExpectedFieldValue.ToBeCalculated,
      hostAdInit: ExpectedFieldValue.ToBeCalculated,
      hostAdStart: ExpectedFieldValue.ToBeCalculated,
      timeSinceStarted: undefined,
      hostAdStop: undefined,
      adSessionParam: ExpectedFieldValue.AsInInitAdInfo,
      adSessionGlobalParam: ExpectedFieldValue.AsInInitAdInfo,
      hostStoppingReason: undefined
    },
    {
      name: 'AD_STARTED',
      clientTime: ExpectedFieldValue.GreaterThanOrEqual_Previous,
      hostAdInitParams: undefined,
      expId: ExpectedFieldValue.AsInOpportunityResponse,
      projectBuildNumber: ExpectedFieldValue.AsInOpportunityResponse,
      projectId: ExpectedFieldValue.AsInOpportunityResponse,
      lastAdLifeCycleEventName: 'AD_STARTING',
      timeSinceLastLifeCycleEvent: ExpectedFieldValue.GreaterThanOrEqual_0,
      hostAdCreate: ExpectedFieldValue.ToBeCalculated,
      timeSinceAdCreatedEvent: ExpectedFieldValue.ToBeCalculated,
      hostAdInit: ExpectedFieldValue.ToBeCalculated,
      hostAdStart: ExpectedFieldValue.ToBeCalculated,
      timeSinceStarted: 0,
      hostAdStop: undefined,
      adSessionParam: ExpectedFieldValue.AsInInitAdInfo,
      adSessionGlobalParam: ExpectedFieldValue.AsInInitAdInfo,
      hostStoppingReason: undefined
    },
    {
      name: 'AD_PLAYING',
      clientTime: ExpectedFieldValue.GreaterThanOrEqual_Previous,
      hostAdInitParams: undefined,
      expId: ExpectedFieldValue.AsInOpportunityResponse,
      projectBuildNumber: ExpectedFieldValue.AsInOpportunityResponse,
      projectId: ExpectedFieldValue.AsInOpportunityResponse,
      lastAdLifeCycleEventName: 'AD_STARTED',
      timeSinceLastLifeCycleEvent: ExpectedFieldValue.GreaterThanOrEqual_0,
      hostAdCreate: ExpectedFieldValue.ToBeCalculated,
      timeSinceAdCreatedEvent: ExpectedFieldValue.ToBeCalculated,
      hostAdInit: ExpectedFieldValue.ToBeCalculated,
      hostAdStart: ExpectedFieldValue.ToBeCalculated,
      timeSinceStarted: ExpectedFieldValue.ToBeCalculated,
      hostAdStop: undefined,
      adSessionParam: ExpectedFieldValue.AsInInitAdInfo,
      adSessionGlobalParam: ExpectedFieldValue.AsInInitAdInfo,
      hostStoppingReason: undefined
    },
    {
      name: 'HOST_AD_STOP',
      clientTime: ExpectedFieldValue.GreaterThanOrEqual_Previous,
      hostAdInitParams: undefined,
      expId: ExpectedFieldValue.AsInOpportunityResponse,
      projectBuildNumber: ExpectedFieldValue.AsInOpportunityResponse,
      projectId: ExpectedFieldValue.AsInOpportunityResponse,
      lastAdLifeCycleEventName: 'AD_PLAYING',
      timeSinceLastLifeCycleEvent: ExpectedFieldValue.GreaterThanOrEqual_0,
      hostAdCreate: ExpectedFieldValue.ToBeCalculated,
      timeSinceAdCreatedEvent: ExpectedFieldValue.ToBeCalculated,
      hostAdInit: ExpectedFieldValue.ToBeCalculated,
      hostAdStart: ExpectedFieldValue.ToBeCalculated,
      timeSinceStarted: ExpectedFieldValue.ToBeCalculated,
      hostAdStop: 0,
      adSessionParam: ExpectedFieldValue.AsInInitAdInfo,
      adSessionGlobalParam: ExpectedFieldValue.AsInInitAdInfo,
      hostStoppingReason: undefined
    },
    {
      name: 'AD_STOPPING',
      clientTime: ExpectedFieldValue.GreaterThanOrEqual_Previous,
      hostAdInitParams: undefined,
      expId: ExpectedFieldValue.AsInOpportunityResponse,
      projectBuildNumber: ExpectedFieldValue.AsInOpportunityResponse,
      projectId: ExpectedFieldValue.AsInOpportunityResponse,
      lastAdLifeCycleEventName: 'HOST_AD_STOP',
      timeSinceLastLifeCycleEvent: ExpectedFieldValue.GreaterThanOrEqual_0,
      hostAdCreate: ExpectedFieldValue.ToBeCalculated,
      timeSinceAdCreatedEvent: ExpectedFieldValue.ToBeCalculated,
      hostAdInit: ExpectedFieldValue.ToBeCalculated,
      hostAdStart: ExpectedFieldValue.ToBeCalculated,
      timeSinceStarted: ExpectedFieldValue.ToBeCalculated,
      hostAdStop: ExpectedFieldValue.ToBeCalculated,
      adSessionParam: ExpectedFieldValue.AsInInitAdInfo,
      adSessionGlobalParam: ExpectedFieldValue.AsInInitAdInfo,
      hostStoppingReason: hostStoppingReason
    },
    {
      name: 'AD_STOPPED',
      clientTime: ExpectedFieldValue.GreaterThanOrEqual_Previous,
      hostAdInitParams: undefined,
      expId: ExpectedFieldValue.AsInOpportunityResponse,
      projectBuildNumber: ExpectedFieldValue.AsInOpportunityResponse,
      projectId: ExpectedFieldValue.AsInOpportunityResponse,
      lastAdLifeCycleEventName: 'AD_STOPPING',
      timeSinceLastLifeCycleEvent: ExpectedFieldValue.GreaterThanOrEqual_0,
      hostAdCreate: ExpectedFieldValue.ToBeCalculated,
      timeSinceAdCreatedEvent: ExpectedFieldValue.ToBeCalculated,
      hostAdInit: ExpectedFieldValue.ToBeCalculated,
      hostAdStart: ExpectedFieldValue.ToBeCalculated,
      timeSinceStarted: ExpectedFieldValue.ToBeCalculated,
      hostAdStop: ExpectedFieldValue.ToBeCalculated,
      adSessionParam: ExpectedFieldValue.AsInInitAdInfo,
      adSessionGlobalParam: ExpectedFieldValue.AsInInitAdInfo,
      hostStoppingReason: hostStoppingReason
    }
  ];
}
