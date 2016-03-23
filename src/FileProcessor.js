import { Promise } from 'es6-promise'
import SparkMD5 from 'spark-md5'

function FileProcessor (file, chunkSize) {
  this.paused = false
  this.file = file
  this.chunkSize = chunkSize
  this.unpauseHandlers = []
}

FileProcessor.prototype.run = async function (fn, startIndex = 0, endIndex) {
  const { file, chunkSize } = this
  const totalChunks = Math.ceil(file.size / chunkSize)
  let spark = new SparkMD5.ArrayBuffer();

  const processIndex = async (index) => {
    if (index === totalChunks - 1 || index === endIndex) {
      return
    }
    if (this.paused) {
      await waitForUnpause()
    }

    const start = startIndex * chunkSize
    const section = file.slice(start, start + chunkSize)
    const chunk = await getData(file, section)
    const checksum = getChecksum(spark, chunk)

    const shouldContinue = await fn(checksum, index, chunk)
    if (shouldContinue !== false) {
      processIndex(index + 1)
    }
  }

  const waitForUnpause = () => {
    return new Promise((resolve) => {
      this.unpauseHandlers.push(resolve)
    })
  }

  processIndex(startIndex)
}

FileProcessor.prototype.pause = function () {
  this.paused = true
}

FileProcessor.prototype.unpause = function () {
  this.paused = false
  this.unpauseHandlers.forEach((fn) => fn())
  this.unpauseHandlers = []
}

function getChecksum (spark, chunk) {
  spark.append(chunk)
  const state = spark.getState()
  const checksum = spark.end()
  spark.setState(state)
  return checksum
}

async function getData (file, blob) {
  return new Promise((resolve, reject) => {
    let reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsArrayBuffer(blob)
  })
}

export default FileProcessor