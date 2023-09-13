import express from 'express'
import fs from 'node:fs/promises'
import sharp from 'sharp'
import { getAllFileEntries, getFileEntry } from './prismaUtils'

const directory = process.env.DIRECTORY ?? './files'

export const app = express()

app.get('/images', async (req, res) => {
  if (req.method !== 'GET')
    throw { status_code: 403, body: 'Method not allowed' }
  const allFiles = await getAllFileEntries()
  res.statusCode = 200
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(allFiles))
})

app.get('/images/:id', async (req, res) => {
  const { id } = req.params
  const file = await getFileEntry(id)
  const { fileName, fileDir, fileType, draft, deleted } = file
  if (draft || deleted) throw { status_code: 404, body: 'File not found' }
  let fileBuffer: Buffer
  fileBuffer = await fs.readFile(`${directory}/${fileDir}/${fileName}`)
  res.statusCode = 200
  res.setHeader('Content-Type', fileType)
  res.setHeader('Content-Length', fileBuffer.byteLength)
  res.setHeader('Content-Disposition', `inline; filename="${fileName}"`)
  res.end(fileBuffer)
})

app.get('/images/:id/:type', async (req, res) => {
  const { id, type } = req.params
  const file = await getFileEntry(id)
  const { fileName, fileDir, fileType, draft, deleted } = file
  if (draft || deleted) throw { status_code: 404, body: 'File not found' }
  let fileBuffer: Buffer
  if (type === 'thumbnail') {
    fileBuffer = await sharp(`${directory}/${fileDir}/${fileName}`)
      .resize(200)
      .jpeg({ mozjpeg: true })
      .toBuffer()
  } else if (type === 'original') {
    fileBuffer = await fs.readFile(`${directory}/${fileDir}/${fileName}`)
  } else {
    throw { status_code: 404, body: 'File not found' }
  }
  res.statusCode = 200
  res.setHeader(
    'Content-Type',
    `${type === 'thumbnail' ? 'image/jpeg' : fileType}`
  )
  res.setHeader('Content-Length', fileBuffer.byteLength)
  res.setHeader('Content-Disposition', `inline; filename="${fileName}"`)
  res.end(fileBuffer)
})
