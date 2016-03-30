require('babel-core/register')
require('babel-polyfill')

var chai = require('chai')

global.window = {
  FileReader: require('filereader'),
  localStorage: require('localStorage')
}

chai.use(require('sinon-chai'))
chai.use(require('chai-as-promised'))
