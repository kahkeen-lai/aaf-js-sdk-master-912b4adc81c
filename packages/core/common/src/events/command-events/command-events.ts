export enum CommandEventType {
    Loaded = 'Loaded',
    Handled = 'Handled',
    Completed = 'Completed',
    Interactive = 'Interactive',
    Executed = 'Executed',
    Paused = 'Paused',
    Resumed = 'Resumed',
    Stopped = 'Stopped',
    Warning = 'Warning',
    Error = 'Error',
    StopExperience = 'StopExperience',
    HostRequest = 'HostRequest'
}

export enum StoppedCommandEventReason {
    NOT_LOGGED_IN = 'NOT_LOGGED_IN',
    NOT_AVAILABLE = 'NOT_AVAILABLE',
    COMMAND_STOPPED = 'COMMAND_STOPPED',
    STOP_EXPERIENCE = 'STOP_EXPERIENCE'
}
