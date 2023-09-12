require('@babel/register');
require('@babel/polyfill');
const chai = require('chai');

chai.use(require('sinon-chai'));
chai.use(require('chai-as-promised'));
chai.use(require('chai-subset'));

process.on('unhandledRejection', err => {
  throw err;
});
