import ExtendableError from 'es6-error'

export class DifferentChunkError extends ExtendableError {
  constructor (chunkIndex) {
    super(`Chunk at index '${chunkIndex}' is different to original`)
  }
}

export class FileAlreadyUploadedError extends ExtendableError {
  constructor (id, url) {
    super(`File '${id}' has already been uploaded to unique url '${url}'`)
  }
}

export class UrlNotFoundError extends ExtendableError {
  constructor (url) {
    super(`Upload URL '${url}' has either expired or is invalid`)
  }
}

export class UploadFailedError extends ExtendableError {
  constructor (status) {
    super(`HTTP status ${status} received from GCS, consider retrying`)
  }
}

export class UnknownResponseError extends ExtendableError {
  constructor () {
    super('Unknown response received from GCS')
  }
}

export class MissingOptionsError extends ExtendableError {
  constructor () {
    super('Missing options for Upload')
  }
}

export class UploadIncompleteError extends ExtendableError {
  constructor () {
    super('Upload is not complete')
  }
}

export class InvalidChunkSizeError extends ExtendableError {
  constructor (chunkSize) {
    super(`Invalid chunk size ${chunkSize}, must be a multiple of 256`)
  }
}