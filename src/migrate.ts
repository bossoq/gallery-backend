import { randomUUID } from 'node:crypto'
import { readdir, writeFile } from 'node:fs/promises'
import { basename, extname, join } from 'node:path'
import { createFileEntry } from './prismaUtils'
import exif from 'exif-reader'
import sharp from 'sharp'
import type { FilestoreEntry } from './prismaUtils.d'

const caches = './caches'
const directory = process.env.DIRECTORY ?? './files'
const imageExt = ['.jpg', '.jpeg', '.png', '.webp', '.tiff', '.gif', '.svg']

// scan directory for files
const scanDirectory = async (dirPath: string): Promise<unknown[]> =>
  Promise.all(
    await readdir(dirPath, { withFileTypes: true })
      .then((entries) =>
        entries.map((entry) => {
          if (
            imageExt.includes(extname(entry.name).toLocaleLowerCase()) ||
            entry.isDirectory()
          ) {
            const childPath = join(dirPath, entry.name)
            return entry.isDirectory() ? scanDirectory(childPath) : childPath
          }
          return null
        })
      )
      .then((files) => files.flat(Infinity).filter((file) => file !== null))
  )

// get metadata for a file
const getFileMetadata = async (filePath: string): Promise<FilestoreEntry> => {
  console.log(`Processing ${filePath}`)
  console.log(`Getting metadata for ${filePath}`)
  const fileMetadata = await sharp(`${filePath}`).metadata()
  const fileId = randomUUID()
  const fileName = basename(filePath)
  const fileDir = filePath
    .replace(`/${fileName}`, '')
    .replace(`${directory.replace('./', '')}/`, '')
  const fileSize = await sharp(`${filePath}`)
    .toBuffer()
    .then((buffer) => buffer.byteLength)
  const fileTags = [fileDir]
  let createdAt = new Date()
  if (fileMetadata.exif) {
    const { exif: exifData } = exif(fileMetadata.exif)
    if (exifData) {
      const { DateTimeOriginal } = exifData
      if (DateTimeOriginal) createdAt = DateTimeOriginal as Date
    }
  }
  console.log(`Finished getting metadata for ${filePath}`)
  const fileBuffer = await sharp(`${filePath}`)
    .resize(200)
    .jpeg({ mozjpeg: true })
    .toBuffer()
  console.log(`Writing thumbnail for ${filePath}`)
  await writeFile(`${caches}/${fileId}.jpg`, fileBuffer)
  console.log(`Finished writing thumbnail for ${filePath}`)
  const fileStore = {
    fileId,
    fileName,
    fileDir,
    fileType: `image/${fileMetadata.format}`,
    fileSize,
    fileTags,
    width: fileMetadata.width ?? 0,
    height: fileMetadata.height ?? 0,
    createdAt
  }
  console.log(`Finished processing ${filePath}`)
  return fileStore
}

scanDirectory(directory).then((files) => {
  files.flat(Infinity).forEach(async (file, idx) => {
    console.log(`Processing file ${idx + 1} of ${files.flat(Infinity).length}`)
    const metadata = await getFileMetadata(file as string)
    await createFileEntry(metadata)
  })
})
