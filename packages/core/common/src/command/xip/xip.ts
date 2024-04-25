import { FireTriggerMode, TriggerType } from '../../fsm/trigger';

export interface Xip {
    commands: CommandModel[];
    _id: string;
    experienceId: string;
    experienceMediaType: string;
    abstractionId?: string;
    itemType?: string;
    action?: string;
    contentType?: string;
    exeAdUUID: string;
}

export interface CommandModel<T = CommandData> {
    id: number;
    commandName: CommandName;
    data: T;
    report: CommandReport;
    playback_reports?: CommandPlaybackReport[];
    executionTriggers: CommandTrigger[];
    fireTriggers: CommandFireTrigger[];
    fireActions?: CommandFireAction[];
}

export interface CommandTrigger {
    trigger: TriggerType;
    conditions?: TriggerType[];
    data?: Map<string, number>;
}

export interface CommandFireTrigger {
    mode: FireTriggerMode;
    name: string;
}

export interface CommandFireAction extends CommandFireTrigger {
    commandId: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type CommandData = any;

export enum CommandName {
    ShowVideo = 'SHOW_VIDEO',
    ShowImage = 'SHOW_IMAGE',
    ReportCommand = 'REPORT_COMMAND',
    ShowDynamicView = 'SHOW_DYNAMIC_VIEW',
    AdScriptCommand = 'ADSCRIPT_COMMAND',
    StopExperience = 'STOP_EXPERIENCE',
    Squeeze = 'SQUEEZE',
    SendRequestToHost = 'SEND_REQUEST_TO_HOST',
    InteractionCommand ='INTERACTION_COMMAND'
}

export interface ReportProvider {
    providers: XipProvider[];
}
export interface CommandReport extends ReportProvider {
    measurementBaseURL: string;
    adLifeCycle: XipAdLifeCycle[];
}
export interface CommandPlaybackReport extends ReportProvider {
    positionSec: number;
}

export interface XipProvider {
    name: string;
    events: XipEvent[];
}

export interface XipEvent {
    url: string;
    clientOutbound?: XipClientOutbound[];
}

export interface XipClientOutbound {
    paramType: ParamTypeClientOutbound;
    paramName: ParamNameClientOutbound;
}
export interface XipAdLifeCycle {
    paramType: ParamTypeAdLifeCycle;
    paramName: number;
}

export type ParamTypeClientOutbound = 'clientFormattedTimeStamp' | 'deviceId' | 'timeFromStarted';
export type ParamNameClientOutbound = 'ClientTime' | 'DeviceID' | 'Duration';
export type ParamTypeAdLifeCycle = 'projectId' | 'projectBuildNumber';
