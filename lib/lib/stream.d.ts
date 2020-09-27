/// <reference path="../decs.d.ts" />
import { Peer } from 'protoo-client';
import WebRTCTransport from './transport';
import { TrackInfo } from './proto';
interface VideoResolutions {
    [name: string]: {
        width: {
            ideal: number;
        };
        height: {
            ideal: number;
        };
    };
}
export declare const VideoResolutions: VideoResolutions;
export interface StreamOptions extends MediaStreamConstraints {
    resolution: string;
    bandwidth?: number;
    codec: string;
}
export declare class Stream extends MediaStream {
    static dispatch: Peer;
    static setDispatch(dispatch: Peer): void;
    mid?: string;
    rid?: string;
    transport?: WebRTCTransport;
    constructor(stream: MediaStream);
}
export declare class LocalStream extends Stream {
    static getUserMedia(options?: StreamOptions): Promise<LocalStream>;
    static getDisplayMedia(options?: StreamOptions): Promise<LocalStream>;
    options: StreamOptions;
    constructor(stream: MediaStream, options: StreamOptions);
    private getVideoConstraints;
    switchDevice(kind: 'audio' | 'video', deviceId: string): Promise<void>;
    mute(kind: 'audio' | 'video'): void;
    unmute(kind: 'audio' | 'video'): Promise<void>;
    publish(rid: string): Promise<void>;
    unpublish(): Promise<void>;
}
export declare class RemoteStream extends Stream {
    static getRemoteMedia(rid: string, mid: string, tracks: Map<string, TrackInfo[]>): Promise<RemoteStream>;
    close(): void;
    unsubscribe(): Promise<import("protoo-client").Response>;
}
export {};
