import { Promise } from 'es6-promise';
import SparkMD5 from 'spark-md5';
import debug from './debug';

function getChecksum(spark, chunk) {
  spark.append(chunk);
  const state = spark.getState();
  const checksum = spark.end();
  spark.setState(state);
  return checksum;
}

async function getData(file, blob) {
  return new Promise((resolve, reject) => {
    const reader = new window.FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsArrayBuffer(blob);
  });
}
class FileProcessor {
  constructor(file, chunkSize) {
    this.paused = false;
    this.file = file;
    this.chunkSize = chunkSize;
    this.unpauseHandlers = [];
  }

  waitForUnpause = async () => {
    return new Promise(resolve => {
      this.unpauseHandlers.push(resolve);
    });
  };

  async run(fn, startIndex = 0, endIndex) {
    const { file, chunkSize } = this;
    const totalChunks = Math.ceil(file.size / chunkSize);
    const spark = new SparkMD5.ArrayBuffer();

    debug('Starting run on file:');
    debug(` - Total chunks: ${totalChunks}`);
    debug(` - Start index: ${startIndex}`);
    debug(` - End index: ${endIndex || totalChunks}`);

    const processIndex = async index => {
      if (index === totalChunks || index === endIndex) {
        debug('File process complete');
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
    }

    const waitForUnpause = () => {
      return new Promise((resolve) => {
        this.unpauseHandlers.push(resolve);
      })
    }

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

export default FileProcessor;
