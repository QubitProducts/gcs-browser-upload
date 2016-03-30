import localStorage from 'localStorage'
import Upload from '../src/Upload'
import { start, stop, getRequests } from './lib/server'
import makeFile from './lib/makeFile'

describe('Functional tests', () => {
  beforeEach(start)
  afterEach(stop)
  afterEach(::localStorage.clear)

  it('should foo', async () => {
    let upload = new Upload({
      id: 'foo',
      url: '/test',
      file: makeFile('large')
    })
    await upload.start()
    console.log(getRequests())
  })
})
