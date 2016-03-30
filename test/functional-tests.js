import localStorage from 'localStorage'
import { expect } from 'chai'
import { get } from 'axios'
import randomString from 'random-string'
import Upload from '../src/Upload'
import { start, reset, stop, getRequests } from './lib/server'
import makeFile from './lib/makeFile'
import waitFor from './lib/waitFor'

describe('Functional', () => {
  let upload = null
  let file = null
  let requests = []

  before(start)
  afterEach(() => {
    if (upload) {
      upload.cancel()
    }
    upload = null
    localStorage.clear()
    reset()
  })
  after(stop)

  async function doUpload (url, length) {
    if (length !== null) {
      file = randomString({ length })
    }
    upload = new Upload({
      id: 'foo',
      url: url,
      chunkSize: 256,
      file: makeFile(file)
    })
    await upload.start()
    requests = getRequests()
    return upload
  }

  describe('when there are no server-side errors', () => {

    describe('a single-chunk upload', () => {
      before(() => doUpload('/simple', 256))

      it('should only upload one chunk', () => {
        expect(requests).to.have.length(1)
      })

      it('should make a PUT request to the right URL', () => {
        expect(requests[0].method).to.equal('PUT')
        expect(requests[0].url).to.equal('/simple')
      })

      it('should send the correct headers', () => {
        expect(requests[0].headers).to.containSubset({
          'content-length': '256',
          'content-range': 'bytes 0-255/256'
        })
      })

      it('should send the file in the body', () => {
        expect(requests[0].body).to.equal(file)
      })
    })

    describe('a multi-chunk upload', () => {
      before(() => doUpload('/simple', 700))

      it('should upload multiple chunks', () => {
        expect(requests).to.have.length(3)
      })

      it('should make multiple PUT requests to the right URL', () => {
        requests.forEach((request) => {
          expect(request.method).to.equal('PUT')
          expect(request.url).to.equal('/simple')
        })
      })

      it('should send the correct headers', () => {
        expect(requests[0].headers).to.containSubset({
          'content-length': '256',
          'content-range': 'bytes 0-255/700'
        })
        expect(requests[1].headers).to.containSubset({
          'content-length': '256',
          'content-range': 'bytes 256-511/700'
        })
        expect(requests[2].headers).to.containSubset({
          'content-length': '188',
          'content-range': 'bytes 512-699/700'
        })
      })

      it('should send a total content length identical to the upload file size', () => {
        const totalSize = requests.reduce((result, request) => {
          return result + parseInt(request.headers['content-length'])
        }, 0)
        expect(totalSize).to.equal(700)
      })

      it('should send the file in the body', () => {
        expect(requests[0].body).to.equal(file.substring(0, 256))
        expect(requests[1].body).to.equal(file.substring(256, 512))
        expect(requests[2].body).to.equal(file.substring(512, 701))
      })
    })

    describe('a paused then resumed upload', () => {
      it('should upload some chunks, pause, check the server for status, then upload the other chunks', async () => {
        doUpload('/pauseresume', 500)
        upload.pause()
        await waitFor(() => getRequests().length > 0)
        expect(getRequests()).to.have.length(1)

        await doUpload('/pauseresume', null)
        expect(requests).to.have.length(3)
        expect(requests[0].body).to.equal(file.substring(0, 256))
        expect(requests[1].body).to.deep.equal({})
        expect(requests[2].body).to.equal(file.substring(256, 501))
      })
    })
  })
})
