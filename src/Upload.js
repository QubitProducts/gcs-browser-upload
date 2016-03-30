import { put } from 'axios'
import FileMeta from './FileMeta'
import FileProcessor from './FileProcessor'
import debug from './debug'
import {
  DifferentChunkError,
  FileAlreadyUploadedError,
  UrlNotFoundError,
  UploadFailedError,
  UnknownResponseError,
  MissingOptionsError,
  UploadIncompleteError,
  InvalidChunkSizeError
} from './errors'

class Upload {
  constructor (args) {
    var opts = {
      chunkSize: 29999872, // 30MB (to nearest 256)
      storage: window.localStorage,
      contentType: 'text/plain',
      id: null,
      url: null,
      file: null,
      ...args
    }

    debug('Creating new upload instance:')
    debug(` - Url: ${opts.url}`)
    debug(` - Id: ${opts.id}`)
    debug(` - File size: ${opts.file.size}`)
    debug(` - Chunk size: ${opts.chunkSize}`)

    if (opts.chunkSize % 256 !== 0) {
      throw new InvalidChunkSizeError(opts.chunkSize)
    }

    if (!opts.id || !opts.url || !opts.file) {
      throw new MissingOptionsError()
    }

    this.opts = opts
    this.meta = new FileMeta(opts.id, opts.chunkSize, opts.storage)
    this.processor = new FileProcessor(opts.file, opts.chunkSize)
  }

  async start () {
    const { meta, processor, opts } = this

    const resumeUpload = async () => {
      const localResumeIndex = meta.getResumeIndex()
      const remoteResumeIndex = await getRemoteResumeIndex()

      const resumeIndex = Math.min(localResumeIndex, remoteResumeIndex)
      debug(`Validating chunks up to index ${resumeIndex}`)
      debug(` - Remote index: ${remoteResumeIndex}`)
      debug(` - Local index: ${localResumeIndex}`)

      try {
        await processor.run(validateChunk, 0, resumeIndex)
      } catch (e) {
        debug('Validation failed, starting from scratch')
        await processor.run(uploadChunk)
        return
      }

      debug('Validation passed, resuming upload')
      await processor.run(uploadChunk, resumeIndex)
    }

    const uploadChunk = async (checksum, index, chunk) => {
      const total = opts.file.size
      const start = index * opts.chunkSize
      const end = index * opts.chunkSize + chunk.byteLength - 1

      const headers = {
        'Content-Type': opts.contentType,
        'Content-Range': `bytes ${start}-${end}/${total}`
      }

      debug(`Uploading chunk ${index}:`)
      debug(` - Chunk length: ${chunk.byteLength}`)
      debug(` - Start: ${start}`)
      debug(` - End: ${end}`)

      const res = await safePut(opts.url, chunk, { headers })
      checkResponseStatus(res.status, opts, [200, 201, 308])
      debug(`Chunk upload succeeded, adding checksum ${checksum}`)
      meta.addChecksum(index, checksum)
    }

    const validateChunk = async (checksum, index) => {
      const isChunkValid = checksum === meta.getChecksum(index)
      if (!isChunkValid) {
        meta.reset()
        throw new DifferentChunkError(index)
      }
    }

    const getRemoteResumeIndex = async () => {
      const headers = {
        'Content-Length': 0,
        'Content-Range': `bytes */${opts.file.size}`
      }
      debug('Retrieving upload status from GCS')
      const res = await safePut(opts.url, null, { headers })

      checkResponseStatus(res.status, opts, [308])
      const header = res.headers['range']
      debug(`Received upload status from GCS: ${header}`)
      const range = header.match(/^(\d+?)-(\d+?)$/)
      const bytesReceived = parseInt(range[2]) + 1
      return Math.floor(bytesReceived / opts.chunkSize)
    }

    if (meta.isResumable()) {
      debug('Upload might be resumable')
      await resumeUpload()
    } else {
      debug('Upload not resumable, starting from scratch')
      await processor.run(uploadChunk)
    }
    debug('Upload complete, resetting meta')
    meta.reset()
  }

  pause () {
    this.processor.pause()
    debug('Upload paused')
  }

  unpause () {
    this.processor.unpause()
    debug('Upload unpaused')
  }

  cancel () {
    this.processor.pause()
    this.meta.reset()
    debug('Upload cancelled')
  }
}

function checkResponseStatus (status, opts, allowed = []) {
  if (allowed.indexOf(status) > -1) {
    return true
  }

  switch (status) {
    case 308:
      throw new UploadIncompleteError()

    case 201:
    case 200:
      throw new FileAlreadyUploadedError(opts.id, opts.url)

    case 404:
      throw new UrlNotFoundError(opts.url)

    case 500:
    case 502:
    case 503:
    case 504:
      throw new UploadFailedError(status)

    default:
      throw new UnknownResponseError(status)
  }
}

async function safePut () {
  try {
    return await put.apply(null, arguments)
  } catch (e) {
    if (e instanceof Error) {
      throw e
    } else {
      return e
    }
  }
}

export default Upload
