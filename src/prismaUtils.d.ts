import type { Prisma } from '@prisma/client'

export interface FilestoreEntry {
  fileId: string
  fileName: string
  fileDir: string
  fileType: string
  fileSize: number
  fileTags?: string[]
  width?: number
  height?: number
  createdAt?: Date
  updatedAt?: Date
  draft?: boolean
  deleted?: boolean
}
