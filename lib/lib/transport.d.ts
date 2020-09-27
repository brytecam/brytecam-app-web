export declare type Codec = 'H264' | 'VP8' | 'VP9' | undefined;
export default class WebRTCTransport {
    private static config;
    static setRTCConfiguration(config: RTCConfiguration): void;
    private pc;
    private rtp;
    constructor(codec?: Codec);
    close(): void;
    addTrack(track: MediaStreamTrack, stream: MediaStream): RTCRtpSender;
    addTransceiver(kind: string): void;
    removeTrack(sender: RTCRtpSender): void;
    getSenders(): RTCRtpSender[];
    setLocalDescription(offer: RTCSessionDescriptionInit): void;
    setRemoteDescription(desc: RTCSessionDescriptionInit): Promise<void>;
    createOffer(options?: RTCOfferOptions): Promise<RTCSessionDescriptionInit>;
    get localDescription(): RTCSessionDescription | null;
    set onicecandidate(cb: (ev: RTCPeerConnectionIceEvent) => any | null);
    set onnegotiationneeded(cb: (ev: Event) => any | null);
    set ontrack(cb: (ev: RTCTrackEvent) => any | null);
}
