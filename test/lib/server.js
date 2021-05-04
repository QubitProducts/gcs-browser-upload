import axios from 'axios'
import express from 'express'
import getPort from 'get-port'
import bodyParser from 'body-parser'

let server = null
let requests = []
let file = null
const router = new express.Router()

router.use(bodyParser.text())

router.use((req, res, next) => {
  const range = req.headers['content-range']
  const matchKnown = range.match(/^bytes (\d+?)-(\d+?)\/(\d+?)$/)
  const matchUnknown = range.match(/^bytes \*\/(\d+?)$/)

  if (matchUnknown) {
    req.range = {
      known: false,
      total: matchUnknown[1]
    }
    next()
  } else if (matchKnown) {
    req.range = {
      known: true,
      start: matchKnown[1],
      end: matchKnown[2],
      total: matchKnown[3]
    }
    next()
  } else {
    res.status(400).send('No valid content-range header provided')
  }
})

router.use((req, res, next) => {
  requests.push({
    method: req.method,
    url: req.originalUrl,
    headers: req.headers,
    body: req.body
  })
  next()
})

router.put('/', (req, res) => {
  if (!file) {
    file = {
      total: req.range.total,
      index: 0
    }
  }

  if (req.range.known) {
    file.index = req.range.end
  }
  res.set('range', `bytes=0-${file.index}`)
  if (file.index + 1 === file.total) {
    res.send(200).send('OK')
  } else {
    res.status(308).send('Resume Incomplete')
  }
})

router.put('/fail', (req, res) => {
  res.status(500).send('Internal Server Error')
})

export async function start () {
  const port = await getPort()
  const app = express()
  app.use('/file', router)
  app.listen(port, (err, s) => {
    server = s
    axios.defaults.baseURL = `http://localhost:${port}`
  })
}

export function resetServer () {
  requests = []
  file = null
}

export function stop () {
  if (server) {
    server.close()
    server = null
  }
}

export function getRequests () {
  return requests
}
