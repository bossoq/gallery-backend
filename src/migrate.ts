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
// const getFileMetadata = async (filePath: string): Promise<FilestoreEntry> => {
//   console.debug(`Processing ${filePath}`)
//   console.debug(`Getting metadata for ${filePath}`)
//   const fileMetadata = await sharp(`${filePath}`).metadata()
//   const fileId = randomUUID()
//   const fileName = basename(filePath)
//   const fileDir = filePath
//     .replace(`/${fileName}`, '')
//     .replace(`${directory.replace('./', '')}/`, '')
//   const fileSize = await sharp(`${filePath}`)
//     .toBuffer()
//     .then((buffer) => buffer.byteLength)
//   const fileTags = [fileDir]
//   let createdAt = new Date()
//   if (fileMetadata.exif) {
//     const { exif: exifData } = exif(fileMetadata.exif)
//     if (exifData) {
//       const { DateTimeOriginal } = exifData
//       if (DateTimeOriginal) createdAt = DateTimeOriginal as Date
//     }
//   }
//   const fileStore = {
//     fileId,
//     fileName,
//     fileDir,
//     fileType: `image/${fileMetadata.format}`,
//     fileSize,
//     fileTags,
//     width: fileMetadata.width ?? 0,
//     height: fileMetadata.height ?? 0,
//     createdAt
//   }
//   console.debug(`Finished getting metadata for ${filePath}`)
//   return fileStore
// }

// const createThumbnail = async (filePath: string, fileId: string) => {
//   const fileBuffer = await sharp(`${filePath}`)
//     .resize(200)
//     .jpeg({ mozjpeg: true })
//     .toBuffer()
//   console.debug(`Writing thumbnail for ${filePath}`)
//   await writeFile(`${caches}/${fileId}.jpg`, fileBuffer)
//   console.debug(`Finished writing thumbnail for ${filePath}`)
// }

scanDirectory(directory).then((files) => {
  for (const [idx, file] of files.flat(Infinity).entries()) {
    console.log(`Processing file ${idx + 1} of ${files.flat(Infinity).length}`)
    console.debug(`Processing ${file}`)
    console.debug(`Getting metadata for ${file}`)
    sharp(`${file}`)
      .metadata()
      .then((fileMetadata) => {
        const fileId = randomUUID().toString()
        const fileName = basename(file as string)
        const fileDir = (file as string)
          .replace(`/${fileName}`, '')
          .replace(`${directory.replace('./', '')}/`, '')
        sharp(`${file as string}`)
          .toBuffer()
          .then((buffer) => buffer.byteLength)
          .then((fileSize) => {
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
            console.debug(`Writing thumbnail for ${file}`)
            sharp(`${file as string}`)
              .resize(200)
              .jpeg({ mozjpeg: true })
              .toBuffer()
              .then((fileBuffer) => {
                writeFile(`${caches}/${fileId}.jpg`, fileBuffer)
                  .then(() =>
                    console.debug(`Finished writing thumbnail for ${file}`)
                  )
                  .catch((err) => console.error(err))
              })
              .catch((err) => console.error(err))
            console.debug(`Writing metadata for ${file}`)
            createFileEntry(fileStore as FilestoreEntry)
              .then(() =>
                console.debug(`Finished writing metadata for ${file}`)
              )
              .catch((err) => console.error(err))
            console.debug(`Finished processing ${file}`)
          })
      })
      .catch((err) => console.error(err))
  }
})
