"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Stream = exports.LocalStream = exports.Client = void 0;
const client_1 = require("./client");
exports.Client = client_1.default;
const stream_1 = require("./stream");
Object.defineProperty(exports, "LocalStream", { enumerable: true, get: function () { return stream_1.LocalStream; } });
Object.defineProperty(exports, "Stream", { enumerable: true, get: function () { return stream_1.Stream; } });
