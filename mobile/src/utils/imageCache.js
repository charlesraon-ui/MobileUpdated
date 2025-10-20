import { Image } from 'react-native';

class ImageCache {
  constructor() {
    this.cache = new Map();
    this.preloadQueue = new Set();
  }

  // Preload an image and cache the result
  async preload(uri) {
    if (!uri || this.cache.has(uri) || this.preloadQueue.has(uri)) {
      return;
    }

    this.preloadQueue.add(uri);

    try {
      await new Promise((resolve, reject) => {
        Image.prefetch(uri)
          .then(() => {
            this.cache.set(uri, { status: 'loaded', timestamp: Date.now() });
            resolve();
          })
          .catch((error) => {
            this.cache.set(uri, { status: 'error', timestamp: Date.now() });
            reject(error);
          });
      });
    } catch (error) {
      console.warn('Image preload failed:', uri, error);
    } finally {
      this.preloadQueue.delete(uri);
    }
  }

  // Preload multiple images
  async preloadBatch(uris) {
    const promises = uris
      .filter(uri => uri && typeof uri === 'string')
      .map(uri => this.preload(uri));
    
    await Promise.allSettled(promises);
  }

  // Check if image is cached
  isCached(uri) {
    const cached = this.cache.get(uri);
    return cached && cached.status === 'loaded';
  }

  // Clear old cache entries (older than 1 hour)
  cleanup() {
    const now = Date.now();
    const maxAge = 60 * 60 * 1000; // 1 hour

    for (const [uri, data] of this.cache.entries()) {
      if (now - data.timestamp > maxAge) {
        this.cache.delete(uri);
      }
    }
  }

  // Get cache size
  size() {
    return this.cache.size;
  }

  // Clear all cache
  clear() {
    this.cache.clear();
    this.preloadQueue.clear();
  }
}

// Export singleton instance
export const imageCache = new ImageCache();

// Auto cleanup every 30 minutes
setInterval(() => {
  imageCache.cleanup();
}, 30 * 60 * 1000);

export default imageCache;