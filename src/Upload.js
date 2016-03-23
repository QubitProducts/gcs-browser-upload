import { put } from 'axios'
import FileMeta from './FileMeta'
import FileProcessor from './FileProcessor'
import {
  DifferentChunkError,
  FileAlreadyUploadedError,
  UrlNotFoundError,
  UploadFailedError,
  UnknownResponseError,
  MissingOptionsError
} from './errors'

function Upload (args) {
  var opts = {
    chunkSize: 3e+7, // 30MB
    storage: localStorage,
    contentType: '',
    id: null,
    url: null,
    file: null
    ...args
  }

  if (!opts.id || !opts.url || !opts.file) {
    throw new MissingOptionsError()
  }

  this.opts = opts
  this.meta = new FileMeta(opts.id, opts.chunkSize, opts.storage)
  this.processor = new FileProcessor(opts.file, opts.chunkSize)
}

Upload.prototype.start = async function () {
  const { meta, processor, opts } = this

  const resumeUpload = async () => {
    const localResumeIndex = meta.getResumeIndex()
    const remoteResumeIndex = await getRemoteResumeIndex()

    const resumeIndex = Math.min(localResumeIndex, remoteResumeIndex)
    try {
      await processor.run(validateChunk, 0, resumeIndex)
    } catch (e) {
      await processor.run(uploadChunk)
      return
    }
    await processor.run(uploadChunk, resumeIndex)
  }

  const uploadChunk = async (checksum, index, chunk) => {
    const total = opts.file.size
    const start = index * opts.chunkSize
    const end = index * opts.chunkSize + chunk.length

    const headers = {
      'Content-Length': chunk.length,
      'Content-Range': `bytes ${start}-${end}/${total}`
    }
    const res = await put(opts.url, chunk, { headers })
    checkResponseStatus(res.status, opts, [200, 201, 308])
    meta.addChecksum(index, checksum);
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
    const res = await put(opts.url, null, { headers })

    checkResponseStatus(res.status, opts, [308])
    const header = res.headers.get('Content-Range')
    const range = header.match(/^(\d+?)-(\d+?)$/)
    return Math.floor(range[1] / opts.chunkSize)
  }

  if (meta.isResumable()) {
    await resumeUpload()
  } else {
    await processor.run(uploadChunk)
  }
  meta.reset()
}

Upload.prototype.pause = function () {
  this.processor.pause()
}

Upload.prototype.unpause = function () {
  this.processor.unpause()
}

Upload.prototype.cancel = function () {
  this.processor.pause()
  this.meta.reset()
}

function checkResponseStatus(status, opts, allowed = []) {
  if (allowed.indexOf(status) > -1) {
    return true
  }

  switch (res.status) {
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
      throw new UploadFailedError(res.status)

    default:
      throw new UnknownResponseError(res.status)
  }
}

export default Upload