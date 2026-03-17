import { User } from "./user"

export type ActionLog = {
  id: string
  userId: string
  user: User
  action: ActionType
  entity?: string
  entityId?: string
  metadata?: any
  ipAddress?: string
  userAgent?: string
  createdAt: Date
}

export enum ActionType {
  USER_LOGIN='USER_LOGIN',
  WALLET_CONNECT='WALLET_CONNECT',
  DOCUMENT_CREATE='DOCUMENT_CREATE',
  DOCUMENT_UPDATE_SIGNER='DOCUMENT_UPDATE_SIGNER',
  DOCUMENT_SIGN='DOCUMENT_SIGN',
  DOCUMENT_ANCHOR='DOCUMENT_ANCHOR',
  DOCUMENT_VERIFY='DOCUMENT_VERIFY',
  DOCUMENT_EXPORT='DOCUMENT_EXPORT',
  DOCUMENT_DELETE='DOCUMENT_DELETE',
}