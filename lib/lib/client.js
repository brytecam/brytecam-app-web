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
const events_1 = require("events");
const protoo_client_1 = require("protoo-client");
const uuid_1 = require("uuid");
const log = require("loglevel");
const stream_1 = require("./stream");
const transport_1 = require("./transport");
class Client extends events_1.EventEmitter {
    constructor(config) {
        super();
        this.onRequest = (request) => {
            log.debug('Handle request from server: [method:%s, data:%o]', request.method, request.data);
        };
        this.onNotification = (notification) => {
            const { method, data } = notification;
            log.info('Handle notification from server: [method:%s, data:%o]', method, data);
            switch (method) {
                case 'peer-join': {
                    const { uid, info } = data;
                    this.emit('peer-join', uid, info);
                    break;
                }
                case 'peer-leave': {
                    const { uid } = data;
                    this.emit('peer-leave', uid);
                    break;
                }
                case 'stream-add': {
                    const { mid, info, tracks } = data;
                    if (mid) {
                        const trackMap = objToStrMap(tracks);
                        this.knownStreams.set(mid, trackMap);
                    }
                    this.emit('stream-add', mid, info);
                    break;
                }
                case 'stream-remove': {
                    const { mid } = data;
                    const stream = this.streams[mid];
                    this.emit('stream-remove', stream);
                    stream.close();
                    break;
                }
                case 'broadcast': {
                    const { uid, info } = data;
                    this.emit('broadcast', uid, info);
                    break;
                }
            }
        };
        const uid = uuid_1.v4();
        const token = config.token;
        if (!config || !config.url) {
            throw new Error('Undefined config or config.url in ion-sdk.');
        }
        if (!config.token) {
            throw new Error("No JWT Specified");
        }
        const transport = new protoo_client_1.WebSocketTransport(`${config.url}/ws?token=${token}`);
        log.setLevel(config.loglevel !== undefined ? config.loglevel : log.levels.WARN);
        this.knownStreams = new Map();
        this.uid = uid;
        this.streams = {};
        this.dispatch = new protoo_client_1.Peer(transport);
        if (config.rtc)
            transport_1.default.setRTCConfiguration(config.rtc);
        stream_1.Stream.setDispatch(this.dispatch);
        this.dispatch.on('open', () => {
            log.info('Peer "open" event');
            this.emit('transport-open');
        });
        this.dispatch.on('disconnected', () => {
            log.info('Peer "disconnected" event');
            this.emit('transport-failed');
        });
        this.dispatch.on('close', () => {
            log.info('Peer "close" event');
            this.emit('transport-closed');
        });
        this.dispatch.on('request', this.onRequest);
        this.dispatch.on('notification', this.onNotification);
    }
    broadcast(info) {
        return this.dispatch.request('broadcast', {
            rid: this.rid,
            uid: this.uid,
            info,
        });
    }
    join(rid, info = { name: 'Guest' }) {
        return __awaiter(this, void 0, void 0, function* () {
            this.rid = rid;
            try {
                const data = yield this.dispatch.request('join', {
                    rid: this.rid,
                    uid: this.uid,
                    info,
                });
                log.info('join success: result => ' + JSON.stringify(data));
            }
            catch (error) {
                log.error('join reject: error =>' + error);
            }
        });
    }
    publish(stream) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.rid) {
                throw new Error('You must join a room before publishing.');
            }
            this.local = stream;
            return yield stream.publish(this.rid);
        });
    }
    subscribe(mid) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.rid) {
                throw new Error('You must join a room before subscribing.');
            }
            const tracks = this.knownStreams.get(mid);
            if (!tracks) {
                throw new Error('Subscribe mid is not known.');
            }
            const stream = yield stream_1.RemoteStream.getRemoteMedia(this.rid, mid, tracks);
            this.streams[mid] = stream;
            return stream;
        });
    }
    leave() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this.dispatch.request('leave', {
                    rid: this.rid,
                    uid: this.uid,
                });
                if (this.local) {
                    this.local.unpublish();
                }
                Object.values(this.streams).forEach((stream) => stream.unsubscribe());
                this.knownStreams.clear();
                log.info('leave success: result => ' + JSON.stringify(data));
            }
            catch (error) {
                log.error('leave reject: error =>' + error);
            }
        });
    }
    close() {
        this.dispatch.close();
    }
}
exports.default = Client;
function objToStrMap(obj) {
    const strMap = new Map();
    for (const k of Object.keys(obj)) {
        strMap.set(k, obj[k]);
    }
    return strMap;
}
