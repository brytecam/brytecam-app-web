"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemoteStream = exports.LocalStream = exports.Stream = exports.VideoResolutions = void 0;
const log = require("loglevel");
const transport_1 = require("./transport");
exports.VideoResolutions = {
    qvga: { width: { ideal: 320 }, height: { ideal: 180 } },
    vga: { width: { ideal: 640 }, height: { ideal: 360 } },
    shd: { width: { ideal: 960 }, height: { ideal: 540 } },
    hd: { width: { ideal: 1280 }, height: { ideal: 720 } },
    fhd: { width: { ideal: 1920 }, height: { ideal: 1090 } },
};
class Stream extends MediaStream {
    constructor(stream) {
        super(stream);
        if (!Stream.dispatch) {
            throw new Error('Dispatch not set.');
        }
    }
    static setDispatch(dispatch) {
        Stream.dispatch = dispatch;
    }
}
exports.Stream = Stream;
class LocalStream extends Stream {
    constructor(stream, options) {
        super(stream);
        this.options = options;
    }
    static getUserMedia(options = {
        codec: 'VP8',
        resolution: 'hd',
        audio: false,
        video: false,
    }) {
        return __awaiter(this, void 0, void 0, function* () {
            const stream = yield navigator.mediaDevices.getUserMedia({
                audio: options.audio,
                video: options.video instanceof Object
                    ? Object.assign(Object.assign({}, exports.VideoResolutions[options.resolution]), options.video) : options.video
                    ? exports.VideoResolutions[options.resolution]
                    : false,
            });
            return new LocalStream(stream, options);
        });
    }
    static getDisplayMedia(options = {
        codec: 'VP8',
        resolution: 'hd',
        audio: false,
        video: true,
    }) {
        return __awaiter(this, void 0, void 0, function* () {
            // @ts-ignore
            const stream = yield navigator.mediaDevices.getDisplayMedia({
                video: true,
            });
            return new LocalStream(stream, options);
        });
    }
    getVideoConstraints() {
        return this.options.video instanceof Object
            ? Object.assign(Object.assign({}, exports.VideoResolutions[this.options.resolution]), this.options.video) : { video: this.options.video };
    }
    switchDevice(kind, deviceId) {
        return __awaiter(this, void 0, void 0, function* () {
            this.options = Object.assign(Object.assign({}, this.options), { [kind]: this.options[kind] instanceof Object
                    ? Object.assign(Object.assign({}, this.options[kind]), { deviceId }) : { deviceId } });
            const stream = yield navigator.mediaDevices.getUserMedia({
                [kind]: kind === 'video' ? Object.assign(Object.assign({}, this.getVideoConstraints()), { deviceId }) : { deviceId },
            });
            const track = stream.getTracks()[0];
            let prev;
            if (kind === 'audio') {
                prev = this.getAudioTracks()[0];
            }
            else if (kind === 'video') {
                prev = this.getVideoTracks()[0];
            }
            this.addTrack(track);
            this.removeTrack(prev);
            prev.stop();
            // If published, replace published track with track from new device
            if (this.transport) {
                this.transport.getSenders().forEach((sender) => __awaiter(this, void 0, void 0, function* () {
                    var _a, _b;
                    if (((_a = sender === null || sender === void 0 ? void 0 : sender.track) === null || _a === void 0 ? void 0 : _a.kind) === track.kind) {
                        (_b = sender.track) === null || _b === void 0 ? void 0 : _b.stop();
                        sender.replaceTrack(track);
                    }
                }));
            }
        });
    }
    mute(kind) {
        if (kind === 'audio') {
            this.getAudioTracks()[0].enabled = false;
        }
        else if (kind === 'video') {
            this.getVideoTracks()[0].enabled = false;
        }
    }
    unmute(kind) {
        return __awaiter(this, void 0, void 0, function* () {
            if (kind === 'audio') {
                this.getAudioTracks()[0].enabled = true;
            }
            else if (kind === 'video') {
                this.getVideoTracks()[0].enabled = true;
            }
        });
    }
    publish(rid) {
        return __awaiter(this, void 0, void 0, function* () {
            const { bandwidth, codec } = this.options;
            let sendOffer = true;
            this.transport = new transport_1.default(codec);
            this.getTracks().map((track) => this.transport.addTrack(track, this));
            const offer = yield this.transport.createOffer({
                offerToReceiveVideo: false,
                offerToReceiveAudio: false,
            });
            log.debug('Created offer => %o', offer);
            this.transport.setLocalDescription(offer);
            this.transport.onicecandidate = () => __awaiter(this, void 0, void 0, function* () {
                if (sendOffer) {
                    sendOffer = false;
                    const jsep = this.transport.localDescription;
                    log.debug(`Sending offer ${jsep}`);
                    const result = yield Stream.dispatch.request('publish', {
                        rid,
                        jsep,
                        options: {
                            codec,
                            bandwidth: Number(bandwidth),
                        },
                    });
                    this.mid = result.mid;
                    log.debug('Got answer => %o', result === null || result === void 0 ? void 0 : result.jsep);
                    yield this.transport.setRemoteDescription(result === null || result === void 0 ? void 0 : result.jsep);
                    this.rid = rid;
                }
            });
            this.transport.onnegotiationneeded = () => __awaiter(this, void 0, void 0, function* () {
                log.info('negotiation needed');
            });
        });
    }
    unpublish() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.rid || !this.mid) {
                throw new Error('Stream is not published.');
            }
            log.info('unpublish rid => %s, mid => %s', this.rid, this.mid);
            if (this.transport) {
                this.transport.close();
                delete this.transport;
            }
            return yield Stream.dispatch
                .request('unpublish', {
                rid: this.rid,
                mid: this.mid,
            })
                .then(() => {
                delete this.rid;
                delete this.mid;
            });
        });
    }
}
exports.LocalStream = LocalStream;
class RemoteStream extends Stream {
    static getRemoteMedia(rid, mid, tracks) {
        return __awaiter(this, void 0, void 0, function* () {
            const allTracks = Array.from(tracks.values()).flat();
            const audio = allTracks.map((t) => t.type.toLowerCase() === 'audio').includes(true);
            const video = allTracks.map((t) => t.type.toLowerCase() === 'video').includes(true);
            let sendOffer = true;
            log.debug('Creating receiver => %s', mid);
            const transport = new transport_1.default();
            if (audio) {
                transport.addTransceiver('audio');
            }
            if (video) {
                transport.addTransceiver('video');
            }
            const desc = yield transport.createOffer();
            log.debug('Created offer => %o', desc);
            transport.setLocalDescription(desc);
            transport.onnegotiationneeded = () => {
                log.debug('negotiation needed');
            };
            transport.onicecandidate = (e) => __awaiter(this, void 0, void 0, function* () {
                if (sendOffer) {
                    log.debug('Send offer');
                    sendOffer = false;
                    const jsep = transport.localDescription;
                    const result = yield this.dispatch.request('subscribe', {
                        rid,
                        jsep,
                        mid,
                    });
                    log.info(`subscribe success => result(mid: ${result.mid})`);
                    log.debug('Got answer => %o', result === null || result === void 0 ? void 0 : result.jsep);
                    yield transport.setRemoteDescription(result === null || result === void 0 ? void 0 : result.jsep);
                }
            });
            const stream = yield new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                try {
                    transport.ontrack = ({ track, streams }) => {
                        log.debug('on track called');
                        // once media for a remote track arrives, show it in the remote video element
                        track.onunmute = () => {
                            if (streams.length > 0) {
                                resolve(streams[0]);
                            }
                            else {
                                reject(new Error('Not enough streams'));
                            }
                        };
                    };
                }
                catch (error) {
                    log.error('subscribe request error  => ' + error);
                    reject(error);
                }
            }));
            const remote = new RemoteStream(stream);
            remote.transport = transport;
            remote.mid = mid;
            remote.rid = rid;
            return remote;
        });
    }
    close() {
        if (!this.transport) {
            throw new Error('Stream is not open.');
        }
        if (this.transport) {
            this.transport.close();
            delete this.transport;
        }
    }
    unsubscribe() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.transport) {
                throw new Error('Stream is not subscribed.');
            }
            log.info('unsubscribe mid => %s', this.mid);
            this.close();
            return yield RemoteStream.dispatch.request('unsubscribe', { mid: this.mid });
        });
    }
}
exports.RemoteStream = RemoteStream;
