// 프로필 이미지 캐싱 유틸리티

interface CachedImage {
  url: string;
  blob: Blob;
  timestamp: number;
  expiresAt: number;
}

class ImageCache {
  private cache = new Map<string, CachedImage>();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24시간
  private readonly MAX_CACHE_SIZE = 10; // 최대 캐시 개수

  /**
   * 이미지를 캐시에 저장
   */
  async cacheImage(url: string): Promise<string> {
    try {
      // 이미 캐시된 이미지가 있는지 확인
      const cached = this.cache.get(url);
      if (cached && Date.now() < cached.expiresAt) {
        console.log('ImageCache: 캐시된 이미지 사용:', url);
        return URL.createObjectURL(cached.blob);
      }

      // 캐시 크기 제한 확인
      if (this.cache.size >= this.MAX_CACHE_SIZE) {
        this.evictOldest();
      }

      console.log('ImageCache: 이미지 다운로드 및 캐싱:', url);
      
      // 이미지 다운로드
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      
      // 캐시에 저장
      const now = Date.now();
      const expiresAt = now + this.CACHE_DURATION;
      
      this.cache.set(url, {
        url,
        blob,
        timestamp: now,
        expiresAt
      });

      console.log('ImageCache: 이미지 캐싱 완료:', url);
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('ImageCache: 이미지 캐싱 실패:', error);
      // 캐싱 실패 시 원본 URL 반환
      return url;
    }
  }

  /**
   * 캐시된 이미지 URL 가져오기
   */
  getCachedImageUrl(url: string): string | null {
    const cached = this.cache.get(url);
    if (cached && Date.now() < cached.expiresAt) {
      return URL.createObjectURL(cached.blob);
    }
    return null;
  }

  /**
   * 이미지가 캐시되어 있는지 확인
   */
  isCached(url: string): boolean {
    const cached = this.cache.get(url);
    return cached !== undefined && Date.now() < cached.expiresAt;
  }

  /**
   * 가장 오래된 캐시 항목 제거
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, value] of this.cache.entries()) {
      if (value.timestamp < oldestTime) {
        oldestTime = value.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      const cached = this.cache.get(oldestKey);
      if (cached) {
        URL.revokeObjectURL(URL.createObjectURL(cached.blob));
      }
      this.cache.delete(oldestKey);
      console.log('ImageCache: 오래된 캐시 제거:', oldestKey);
    }
  }

  /**
   * 특정 URL의 캐시 제거
   */
  removeFromCache(url: string): void {
    const cached = this.cache.get(url);
    if (cached) {
      URL.revokeObjectURL(URL.createObjectURL(cached.blob));
      this.cache.delete(url);
      console.log('ImageCache: 캐시 제거:', url);
    }
  }

  /**
   * 모든 캐시 제거
   */
  clearCache(): void {
    for (const [, value] of this.cache.entries()) {
      URL.revokeObjectURL(URL.createObjectURL(value.blob));
    }
    this.cache.clear();
    console.log('ImageCache: 모든 캐시 제거됨');
  }

  /**
   * 캐시 상태 정보
   */
  getCacheInfo(): { size: number; entries: Array<{ url: string; timestamp: number; expiresAt: number }> } {
    const entries = Array.from(this.cache.entries()).map(([url, cached]) => ({
      url,
      timestamp: cached.timestamp,
      expiresAt: cached.expiresAt
    }));

    return {
      size: this.cache.size,
      entries
    };
  }
}

// 전역 이미지 캐시 인스턴스
export const imageCache = new ImageCache();

/**
 * 프로필 이미지 URL을 캐시된 URL로 변환
 */
export const getCachedProfileImageUrl = async (url: string): Promise<string> => {
  return await imageCache.cacheImage(url);
};

/**
 * 프로필 이미지가 캐시되어 있는지 확인
 */
export const isProfileImageCached = (url: string): boolean => {
  return imageCache.isCached(url);
};

/**
 * 프로필 이미지 캐시 제거
 */
export const removeProfileImageFromCache = (url: string): void => {
  imageCache.removeFromCache(url);
};

/**
 * 모든 프로필 이미지 캐시 제거
 */
export const clearProfileImageCache = (): void => {
  imageCache.clearCache();
}; 