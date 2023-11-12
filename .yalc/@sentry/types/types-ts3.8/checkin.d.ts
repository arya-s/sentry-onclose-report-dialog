import { TraceContext } from './context';
interface CrontabSchedule {
    type: 'crontab';
    value: string;
}
interface IntervalSchedule {
    type: 'interval';
    value: number;
    unit: 'year' | 'month' | 'week' | 'day' | 'hour' | 'minute';
}
type MonitorSchedule = CrontabSchedule | IntervalSchedule;
export interface SerializedCheckIn {
    check_in_id: string;
    monitor_slug: string;
    status: 'in_progress' | 'ok' | 'error';
    duration?: number;
    release?: string;
    environment?: string;
    monitor_config?: {
        schedule: MonitorSchedule;
        checkin_margin?: number;
        max_runtime?: number;
        timezone?: string;
    };
    contexts?: {
        trace?: TraceContext;
    };
}
export interface InProgressCheckIn {
    monitorSlug: SerializedCheckIn['monitor_slug'];
    status: 'in_progress';
}
export interface FinishedCheckIn {
    monitorSlug: SerializedCheckIn['monitor_slug'];
    status: 'ok' | 'error';
    checkInId: SerializedCheckIn['check_in_id'];
    duration?: SerializedCheckIn['duration'];
}
export type CheckIn = InProgressCheckIn | FinishedCheckIn;
type SerializedMonitorConfig = NonNullable<SerializedCheckIn['monitor_config']>;
export interface MonitorConfig {
    schedule: MonitorSchedule;
    checkinMargin?: SerializedMonitorConfig['checkin_margin'];
    maxRuntime?: SerializedMonitorConfig['max_runtime'];
    timezone?: SerializedMonitorConfig['timezone'];
}
export {};
//# sourceMappingURL=checkin.d.ts.map