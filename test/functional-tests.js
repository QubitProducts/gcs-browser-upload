/* eslint-disable no-undef */
import localStorage from 'localStorage';
import { expect } from 'chai';
import randomString from 'random-string';
import Upload from '../src/Upload';
import { start, resetServer, stop, getRequests } from './lib/server';
import makeFile from './lib/makeFile';
import waitFor from './lib/waitFor';

const FileReader = require('filereader');

global.window = {
  FileReader,
  localStorage,
};

describe('Functional', function() {
  before(start);
  after(stop);

  let upload = null;
  let file = null;
  let requests = [];

  async function doUpload(length, url) {
    if (length !== null) {
      file = randomString({ length });
    }
    upload = new Upload(
      {
        id: 'foo',
        url: url || '/file',
        chunkSize: 256,
        file: makeFile(file),
      },
      true
    );
    await upload.start();
    requests = getRequests();
    return upload;
  }

  function reset() {
    localStorage.clear();
    resetServer();
    if (upload) {
      upload.cancel();
      upload = null;
    }
  }

  describe('a single-chunk upload', function() {
    before(function() {
      return doUpload(256);
    });
    after(reset);

    it('should only upload one chunk', function() {
      expect(requests).to.have.length(1);
    });

    it('should make a PUT request to the right URL', function() {
      expect(requests[0].method).to.equal('PUT');
      expect(requests[0].url).to.equal('/file');
    });

    it('should send the correct headers', function() {
      expect(requests[0].headers).to.containSubset({
        'content-length': '256',
        'content-range': 'bytes 0-255/256',
      });
    });

    it('should send the file in the body', function() {
      expect(requests[0].body).to.equal(file);
    });
  });

  describe('a multi-chunk upload', function() {
    before(function() {
      return doUpload(700);
    });
    after(reset);

    it('should upload multiple chunks', function() {
      expect(requests).to.have.length(3);
    });

    it('should make multiple PUT requests to the right URL', function() {
      requests.forEach(request => {
        expect(request.method).to.equal('PUT');
        expect(request.url).to.equal('/file');
      });
    });

    it('should send the correct headers', function() {
      expect(requests[0].headers).to.containSubset({
        'content-length': '256',
        'content-range': 'bytes 0-255/700',
      });
      expect(requests[1].headers).to.containSubset({
        'content-length': '256',
        'content-range': 'bytes 256-511/700',
      });
      expect(requests[2].headers).to.containSubset({
        'content-length': '188',
        'content-range': 'bytes 512-699/700',
      });
    });

    it('should send a total content length identical to the upload file size', function() {
      const totalSize = requests.reduce((result, request) => {
        return result + parseInt(request.headers['content-length'], 10);
      }, 0);
      expect(totalSize).to.equal(700);
    });

    it('should send the file in the body', function() {
      expect(requests[0].body).to.equal(file.substring(0, 256));
      expect(requests[1].body).to.equal(file.substring(256, 512));
      expect(requests[2].body).to.equal(file.substring(512, 701));
    });
  });

  describe('a paused then resumed upload', function() {
    after(reset);

    it('should stop uploading after being paused', async function() {
      doUpload(500);
      upload.pause();
      await waitFor(() => {
        requests = getRequests();
        return requests.length > 0;
      });
      expect(requests).to.have.length(1);
      expect(requests[0].body).to.equal(file.substring(0, 256));
    });

    it('should check the server for status before resuming', async function() {
      await doUpload(null);
      expect(requests[1].body).to.deep.equal({});
    });

    it('should send the rest of the chunks after being resumed', function() {
      expect(requests).to.have.length(3);
      expect(requests[2].body).to.equal(file.substring(256, 501));
    });
  });

  describe('a paused upload that is resumed with a different file', function() {
    let firstFile = null;

    before(async function() {
      doUpload(500);
      firstFile = file;
      upload.pause();
      await waitFor(() => getRequests().length > 0);
    });
    after(reset);

    it('should check the server for status before resuming', async function() {
      await doUpload(500);
      expect(requests[1].body).to.deep.equal({});
    });

    it('should upload part of the first file', function() {
      expect(firstFile).to.not.equal(file);
      expect(requests[0].body).to.equal(firstFile.substring(0, 256));
    });

    it('should upload the entire new file', function() {
      expect(requests).to.have.length(4);
      expect(requests[2].body).to.equal(file.substring(0, 256));
      expect(requests[3].body).to.equal(file.substring(256, 501));
    });
  });

  describe("an upload to a url that doesn't exist", function() {
    it('should throw a UrlNotFoundError', function() {
      return expect(doUpload(200, '/notfound')).to.be.rejectedWith(
        Upload.errors.UrlNotFoundError
      );
    });
  });

  describe('an upload that results in a server error', function() {
    it('should throw an UploadFailedError', function() {
      return expect(doUpload(200, '/file/fail')).to.be.rejectedWith(
        Upload.errors.UploadFailedError
      );
    });
  });
});
