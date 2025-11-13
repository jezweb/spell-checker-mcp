/**
 * R2 Storage Module
 * Handles storing corrected documents to Cloudflare R2 with:
 * - Random UUID-based file naming (non-guessable)
 * - 30-day auto-deletion via lifecycle policy
 * - Public URL access via custom domain
 */

// Custom domain for public R2 access (configure in Cloudflare dashboard)
const R2_PUBLIC_DOMAIN = 'https://spellcheck.files.jezweb.ai';

export interface R2StorageInfo {
  url: string;
  key: string;
  expiresAt: string;
  size: number;
}

export interface R2UploadOptions {
  contentType?: string;
  metadata?: Record<string, string>;
}

/**
 * Generate a unique, non-guessable file key for R2 storage
 * Format: corrected/{YYYY-MM-DD}-{uuid}.txt
 *
 * Example: corrected/2025-11-13-f47ac10b-58cc-4372-a567-0e02b2c3d479.txt
 */
export function generateFileKey(extension: string = 'txt'): string {
  const uuid = crypto.randomUUID();
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return `corrected/${date}-${uuid}.${extension}`;
}

/**
 * Upload corrected text to R2 storage
 *
 * @param r2Bucket - Cloudflare R2 bucket binding
 * @param content - Text content to store
 * @param key - File key (use generateFileKey() if not provided)
 * @param options - Optional content type and metadata
 * @returns R2StorageInfo with public URL and expiry
 */
export async function uploadToR2(
  r2Bucket: R2Bucket,
  content: string,
  key?: string,
  options: R2UploadOptions = {}
): Promise<R2StorageInfo> {
  // Generate key if not provided
  const fileKey = key || generateFileKey();

  // Set default content type
  const contentType = options.contentType || 'text/plain; charset=utf-8';

  // Calculate expiry date (30 days from now, per lifecycle policy)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  // Get content size
  const size = new Blob([content]).size;

  // Upload to R2
  await r2Bucket.put(fileKey, content, {
    httpMetadata: {
      contentType: contentType,
    },
    customMetadata: {
      uploadedAt: new Date().toISOString(),
      size: size.toString(),
      ...options.metadata,
    },
  });

  // Generate public URL
  const url = getPublicUrl(fileKey);

  return {
    url,
    key: fileKey,
    expiresAt: expiresAt.toISOString(),
    size,
  };
}

/**
 * Generate public URL for an R2 file
 *
 * @param key - R2 file key
 * @returns Full public URL
 */
export function getPublicUrl(key: string): string {
  return `${R2_PUBLIC_DOMAIN}/${key}`;
}

/**
 * Delete a file from R2 storage
 * Note: Files auto-delete after 30 days via lifecycle policy,
 * so manual deletion is usually not needed
 *
 * @param r2Bucket - Cloudflare R2 bucket binding
 * @param key - File key to delete
 */
export async function deleteFromR2(
  r2Bucket: R2Bucket,
  key: string
): Promise<void> {
  await r2Bucket.delete(key);
}

/**
 * Check if a file exists in R2
 *
 * @param r2Bucket - Cloudflare R2 bucket binding
 * @param key - File key to check
 * @returns True if file exists, false otherwise
 */
export async function fileExists(
  r2Bucket: R2Bucket,
  key: string
): Promise<boolean> {
  const object = await r2Bucket.head(key);
  return object !== null;
}

/**
 * Get file metadata from R2
 *
 * @param r2Bucket - Cloudflare R2 bucket binding
 * @param key - File key
 * @returns File metadata or null if not found
 */
export async function getFileMetadata(
  r2Bucket: R2Bucket,
  key: string
): Promise<R2Object | null> {
  return await r2Bucket.head(key);
}

/**
 * List files in R2 with optional prefix filter
 * Useful for debugging or admin operations
 *
 * @param r2Bucket - Cloudflare R2 bucket binding
 * @param prefix - Optional prefix to filter (e.g., "corrected/2025-11-13")
 * @param limit - Maximum number of results (default: 1000)
 * @returns List of R2 objects
 */
export async function listFiles(
  r2Bucket: R2Bucket,
  prefix?: string,
  limit: number = 1000
): Promise<R2Objects> {
  return await r2Bucket.list({
    prefix: prefix,
    limit: limit,
  });
}
