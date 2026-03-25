/**
 * Database Service
 *
 * Re-exports ID generation utilities from @pferm/shared-lib.
 * The canonical implementation lives in packages/shared-lib/src/id.ts.
 */

export {
  generateId,
  ID_PREFIXES,
  generateAuthUserId,
  generateSessionId,
  generateAccountId,
  generateVerificationId,
  generateUserId,
  generateMediaFileId,
  generateBatchId,
} from "@pferm/shared-lib";
