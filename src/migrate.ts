import { randomUUID } from 'node:crypto'
import { readdir } from 'node:fs/promises'
import { basename, extname, join } from 'node:path'
import { createFileEntry } from './prismaUtils'
import exif from 'exif-reader'
import sharp from 'sharp'
import type { FilestoreEntry } from './prismaUtils.d'

const directory = process.env.DIRECTORY ?? './files'
const imageExt = ['.jpg', '.jpeg', '.png', '.webp', '.tiff', '.gif', '.svg']

// scan directory for files
const scanDirectory = async (dirPath: string): Promise<unknown[]> =>
  Promise.all(
    await readdir(dirPath, { withFileTypes: true })
      .then((entries) =>
        entries.map((entry) => {
          if (imageExt.includes(extname(entry.name)) || entry.isDirectory()) {
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
  const fileMetadata = await sharp(`${filePath}`).metadata()
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
  const fileStore = {
    fileId: randomUUID(),
    fileName,
    fileDir,
    fileType: `image/${fileMetadata.format}`,
    fileSize,
    fileTags,
    width: fileMetadata.width ?? 0,
    height: fileMetadata.height ?? 0,
    createdAt
  }
  return fileStore
}

scanDirectory(directory).then((files) => {
  files.flat(Infinity).forEach(async (file) => {
    const metadata = await getFileMetadata(file as string)
    await createFileEntry(metadata)
  })
})
