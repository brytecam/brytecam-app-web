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
const sdp_transform_1 = require("sdp-transform");
const log = require("loglevel");
var PayloadType;
(function (PayloadType) {
    PayloadType[PayloadType["PCMU"] = 0] = "PCMU";
    PayloadType[PayloadType["PCMA"] = 8] = "PCMA";
    PayloadType[PayloadType["G722"] = 9] = "G722";
    PayloadType[PayloadType["Opus"] = 111] = "Opus";
    PayloadType[PayloadType["VP8"] = 96] = "VP8";
    PayloadType[PayloadType["VP9"] = 98] = "VP9";
    PayloadType[PayloadType["H264"] = 102] = "H264";
})(PayloadType || (PayloadType = {}));
function rtp(name) {
    switch (name) {
        case 'H264':
            return [
                {
                    payload: PayloadType.H264,
                    codec: 'H264',
                    rate: 90000,
                },
            ];
        case 'VP8':
            return [
                {
                    payload: PayloadType.VP8,
                    codec: 'VP8',
                    rate: 90000,
                },
            ];
        case 'VP9':
            return [
                {
                    payload: PayloadType.VP9,
                    codec: 'VP9',
                    rate: 90000,
                },
            ];
        default:
            return [];
    }
}
let WebRTCTransport = /** @class */ (() => {
    class WebRTCTransport {
        constructor(codec) {
            if (!WebRTCTransport.config) {
                throw new Error('RTConfiguration not set.');
            }
            this.pc = new RTCPeerConnection(WebRTCTransport.config);
            this.rtp = codec ? rtp(codec) : null;
        }
        static setRTCConfiguration(config) {
            WebRTCTransport.config = config;
        }
        close() {
            this.pc.ontrack = null;
            this.pc.onicecandidate = null;
            this.pc.onnegotiationneeded = null;
            this.pc.getSenders().forEach((sender) => this.pc.removeTrack(sender));
            this.pc.close();
        }
        addTrack(track, stream) {
            return this.pc.addTrack(track, stream);
        }
        addTransceiver(kind) {
            this.pc.addTransceiver(kind, { direction: 'recvonly' });
        }
        removeTrack(sender) {
            this.pc.removeTrack(sender);
        }
        getSenders() {
            return this.pc.getSenders();
        }
        setLocalDescription(offer) {
            this.pc.setLocalDescription(offer);
        }
        setRemoteDescription(desc) {
            return this.pc.setRemoteDescription(desc);
        }
        createOffer(options) {
            return __awaiter(this, void 0, void 0, function* () {
                const offer = yield this.pc.createOffer(options);
                if (!this.rtp)
                    return offer;
                const session = sdp_transform_1.parse(offer.sdp);
                const videoIdx = session.media.findIndex(({ type, ssrcGroups }) => type === 'video' && !!ssrcGroups);
                if (videoIdx === -1)
                    return offer;
                const { payload } = this.rtp[0];
                session.media[videoIdx].payloads = `${payload}`; // + " 97";
                session.media[videoIdx].rtp = this.rtp;
                const fmtp = [
                // { "payload": 97, "config": "apt=" + payload }
                ];
                session.media[videoIdx].fmtp = fmtp;
                const rtcpFB = [
                    { payload, type: 'transport-cc', subtype: undefined },
                    { payload, type: 'ccm', subtype: 'fir' },
                    { payload, type: 'nack', subtype: undefined },
                    { payload, type: 'nack', subtype: 'pli' },
                ];
                session.media[videoIdx].rtcpFb = rtcpFB;
                const ssrcGroup = session.media[videoIdx].ssrcGroups[0];
                const ssrcs = ssrcGroup.ssrcs;
                const ssrc = parseInt(ssrcs.split(' ')[0], 10);
                log.debug('ssrcs => %s, video %s', ssrcs, ssrc);
                session.media[videoIdx].ssrcGroups = [];
                session.media[videoIdx].ssrcs = session.media[videoIdx].ssrcs.filter((item) => item.id === ssrc);
                offer.sdp = sdp_transform_1.write(session);
                return offer;
            });
        }
        get localDescription() {
            return this.pc.localDescription;
        }
        set onicecandidate(cb) {
            this.pc.onicecandidate = cb;
        }
        set onnegotiationneeded(cb) {
            this.pc.onnegotiationneeded = cb;
        }
        set ontrack(cb) {
            this.pc.ontrack = cb;
        }
    }
    WebRTCTransport.config = {
        iceServers: [{ urls: 'stun:stun.stunprotocol.org:3478' }],
    };
    return WebRTCTransport;
})();
exports.default = WebRTCTransport;
