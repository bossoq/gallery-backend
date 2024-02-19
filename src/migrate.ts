import { randomUUID } from 'node:crypto'
import { readdir, readFile, writeFile } from 'node:fs/promises'
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

// migrate files
const migrate = async (directory: string) => {
  const files = await scanDirectory(directory)
  const flatFiles = files.flat(Infinity)
  const totalFiles = flatFiles.length
  for (const [idx, file] of flatFiles.entries()) {
    console.log(`Processing file ${idx + 1} of ${totalFiles}`)
    console.debug(`Processing ${file}`)
    console.debug(`Getting metadata for ${file}`)
    const fileBuff = await readFile(file as string)
    const fileMetadata = await sharp(fileBuff).metadata()
    console.debug(`${file} format: ${fileMetadata.format}`)
    const fileId = randomUUID().toString()
    const fileName = basename(file as string)
    const fileDir = (file as string)
      .replace(`/${fileName}`, '')
      .replace(`${directory.replace('./', '')}/`, '')
    const fileSize = fileBuff.byteLength
    console.debug(`${file} size: ${fileSize} bytes`)
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
    console.debug(`Finished getting metadata for ${file}`)
    console.debug(`Creating thumbnail for ${file}`)
    const fileBuffer = await sharp(fileBuff)
      .resize(200)
      .jpeg({ mozjpeg: true })
      .toBuffer()
    console.debug(`Writing thumbnail for ${file}`)
    await writeFile(`${caches}/${fileId}.jpg`, fileBuffer)
    console.debug(`Finished writing thumbnail for ${file}`)
    console.debug(`Writing metadata for ${file}`)
    await createFileEntry(fileStore as FilestoreEntry)
    console.debug(`Finished writing metadata for ${file}`)
  }
}
migrate(directory)
