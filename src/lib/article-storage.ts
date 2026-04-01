import path from 'path';

export const ARTICLE_STORAGE_PREFIX = 'storage/articles/';

export function normalizeArticleStoragePath(filePath: string): string {
  if (!filePath) return filePath;
  return filePath.startsWith(ARTICLE_STORAGE_PREFIX)
    ? filePath
    : `${ARTICLE_STORAGE_PREFIX}${filePath.replace(/^\/+/, '')}`;
}

export function getArticleAbsolutePath(filePath: string): string {
  return path.join(process.cwd(), normalizeArticleStoragePath(filePath));
}