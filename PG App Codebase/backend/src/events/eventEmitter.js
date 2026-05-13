import EventEmitter from "events";

class BackendEventEmitter extends EventEmitter {}

const eventEmitter = new BackendEventEmitter();

export default eventEmitter;
