import axios from 'axios'
import express from 'express'
import getPort from 'get-port'
import pify from 'pify'
import bodyParser from 'body-parser'

let server = null
let requests = []
const router = new express.Router()

router.use('/test', storeRequest, (req, res) => {
  res.send('ok')
})

function storeRequest (req, res, next) {
  requests.push({
    url: req.originalUrl,
    headers: req.headers
  })
  next()
}

export async function start () {
  const port = await getPort()
  const app = express()
  app.use(bodyParser.text({ limit: '150MB' }))
  app.use(router)
  server = await pify(::app.listen)(port)
  axios.defaults.baseURL = `http://localhost:${port}`
}

export async function stop () {
  if (server) {
    server.close()
    server = null
  }
  requests = []
}

export function getRequests () {
  return requests
}
