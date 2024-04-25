export interface HostRequestCommandData {
    type: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    arguments?: Map<string, any>;
    timeout_ms?: number;
    mandatory?: boolean;
}
