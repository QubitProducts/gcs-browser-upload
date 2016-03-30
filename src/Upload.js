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
  UploadIncompleteError
} from './errors'

class Upload {
  constructor (args) {
    var opts = {
      chunkSize: 3e+7, // 30MB
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
      const end = index * opts.chunkSize + chunk.byteLength

      const headers = {
        'Content-Length': chunk.byteLength,
        'Content-Type': opts.contentType,
        'Content-Range': `bytes ${start}-${end}/${total}`
      }

      debug(`Uploading chunk ${index}:`)
      debug(` - Chunk length: ${chunk.byteLength}`)
      debug(` - Start: ${start}`)
      debug(` - End: ${end}`)

      const res = await put(opts.url, chunk, { headers })
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
      debug('Retrieving upload status from GCS'. headers)
      const res = await put(opts.url, null, { headers })

      checkResponseStatus(res.status, opts, [308])
      const header = res.headers.get('Content-Range')
      debug(`Received upload status from GCS: ${header}`)
      const range = header.match(/^(\d+?)-(\d+?)$/)
      return Math.floor(range[1] / opts.chunkSize)
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
  }

  unpause () {
    this.processor.unpause()
  }

  cancel () {
    this.processor.pause()
    this.meta.reset()
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

export default Upload
