import { PrismaClient } from '@prisma/client'
import type { FilestoreEntry } from './prismaUtils.d'

const prisma = new PrismaClient()

export const createFileEntry = async (
  fileMeta: FilestoreEntry
): Promise<void> => {
  await prisma.filestore.create({
    data: {
      fileId: fileMeta.fileId,
      fileName: fileMeta.fileName,
      fileDir: fileMeta.fileDir,
      fileType: fileMeta.fileType,
      fileSize: fileMeta.fileSize,
      fileTags: fileMeta.fileTags ?? [],
      width: fileMeta.width ?? 0,
      height: fileMeta.height ?? 0,
      createdAt: fileMeta.createdAt ?? new Date(),
      draft: false
    }
  })
}

export const getAllFileEntries = async (): Promise<FilestoreEntry[]> => {
  const allFiles = await prisma.filestore.findMany({
    select: {
      fileId: true,
      fileName: true,
      fileDir: true,
      fileType: true,
      fileSize: true,
      fileTags: true,
      width: true,
      height: true,
      createdAt: true,
      updatedAt: true
    },
    where: {
      draft: false,
      deleted: false
    }
  })
  return allFiles
}

export const getFileEntry = async (id: string): Promise<FilestoreEntry> => {
  const file = await prisma.filestore.findUnique({
    select: {
      fileId: true,
      fileName: true,
      fileDir: true,
      fileType: true,
      fileSize: true,
      fileTags: true,
      width: true,
      height: true,
      createdAt: true,
      updatedAt: true
    },
    where: {
      fileId: id
    }
  })
  if (!file) throw { status_code: 404, body: 'File not found' }
  return file
}
