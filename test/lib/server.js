import axios from 'axios'
import express from 'express'
import getPort from 'get-port'
import pify from 'pify'
import bodyParser from 'body-parser'

let server = null
let requests = []
const router = new express.Router()

router.put('/simple', storeRequest, (req, res) => {
  res.send('ok')
})

router.put('/pauseresume', storeRequest, (req, res) => {
  res.set('range', '0-255').status(308).send('ok')
})

function storeRequest (req, res, next) {
  requests.push({
    method: req.method,
    url: req.originalUrl,
    headers: req.headers,
    body: req.body
  })
  next()
}

export async function start () {
  const port = await getPort()
  const app = express()
  app.use(bodyParser.text())
  app.use(router)
  server = await pify(::app.listen)(port)
  axios.defaults.baseURL = `http://localhost:${port}`
}

export function reset () {
  requests = []
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
