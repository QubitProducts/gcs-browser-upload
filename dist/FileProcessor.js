"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _es6Promise = require("es6-promise");

var _sparkMd = _interopRequireDefault(require("spark-md5"));

var _debug = _interopRequireDefault(require("./debug"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function getChecksum(spark, chunk) {
  spark.append(chunk);
  const state = spark.getState();
  const checksum = spark.end();
  spark.setState(state);
  return checksum;
}

async function getData(file, blob) {
  return new _es6Promise.Promise((resolve, reject) => {
    const reader = new window.FileReader();

    reader.onload = () => resolve(reader.result);

    reader.onerror = reject;
    reader.readAsArrayBuffer(blob);
  });
}

class FileProcessor {
  constructor(file, chunkSize) {
    _defineProperty(this, "waitForUnpause", async () => {
      return new _es6Promise.Promise(resolve => {
        this.unpauseHandlers.push(resolve);
      });
    });

    this.paused = false;
    this.file = file;
    this.chunkSize = chunkSize;
    this.unpauseHandlers = [];
  }

  async run(fn, startIndex = 0, endIndex) {
    const {
      file,
      chunkSize
    } = this;
    const totalChunks = Math.ceil(file.size / chunkSize);
    const spark = new _sparkMd.default.ArrayBuffer();
    (0, _debug.default)('Starting run on file:');
    (0, _debug.default)(` - Total chunks: ${totalChunks}`);
    (0, _debug.default)(` - Start index: ${startIndex}`);
    (0, _debug.default)(` - End index: ${endIndex || totalChunks}`);

    const processIndex = async index => {
      if (index === totalChunks || index === endIndex) {
        (0, _debug.default)('File process complete');
        return true;
      }

      if (this.paused) {
        await this.waitForUnpause();
      }

      const start = index * chunkSize;
      const section = file.slice(start, start + chunkSize);
      const chunk = await getData(file, section);
      const checksum = getChecksum(spark, chunk);
      const shouldContinue = await fn(checksum, index, chunk);

      if (shouldContinue !== false) {
        return processIndex(index + 1);
      }

      return false;
    };

    await processIndex(startIndex);
  }

  pause() {
    this.paused = true;
  }

  unpause() {
    this.paused = false;
    this.unpauseHandlers.forEach(fn => fn());
    this.unpauseHandlers = [];
  }

}

var _default = FileProcessor;
exports.default = _default;