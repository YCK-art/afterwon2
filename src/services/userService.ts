import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

interface UserData {
  uid: string;
  displayName: string;
  email: string;
  profileImageURL?: string;
  createdAt: any;
  lastLoginAt: any;
  loginCount: number;
  lastSeenAt: any;
}

interface CachedUserData {
  data: UserData;
  timestamp: number;
  expiresAt: number;
}

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24시간 (밀리초)
const userCache = new Map<string, CachedUserData>();

/**
 * 사용자 데이터를 캐시에서 가져오거나 Firestore에서 새로 가져옵니다.
 * 24시간 캐싱을 지원합니다.
 */
export const getUserData = async (uid: string): Promise<UserData | null> => {
  try {
    // 캐시 확인
    const cached = userCache.get(uid);
    const now = Date.now();
    
    if (cached && now < cached.expiresAt) {
      console.log('캐시된 사용자 데이터 사용:', uid);
      return cached.data;
    }
    
    // 캐시가 만료되었거나 없으면 Firestore에서 가져오기
    console.log('Firestore에서 사용자 데이터 가져오기:', uid);
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data() as UserData;
      
      // 캐시에 저장 (24시간 후 만료)
      const expiresAt = now + CACHE_DURATION;
      userCache.set(uid, {
        data: userData,
        timestamp: now,
        expiresAt
      });
      
      console.log('사용자 데이터 캐시에 저장:', uid);
      return userData;
    } else {
      console.log('Firestore에 사용자 데이터가 없음:', uid);
      return null;
    }
  } catch (error) {
    console.error('사용자 데이터 가져오기 오류:', error);
    return null;
  }
};

/**
 * 사용자 데이터를 Firestore에 업데이트하고 캐시도 갱신합니다.
 */
export const updateUserData = async (uid: string, updates: Partial<UserData>): Promise<void> => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      ...updates,
      lastSeenAt: serverTimestamp()
    });
    
    // 캐시된 데이터가 있으면 업데이트
    const cached = userCache.get(uid);
    if (cached) {
      cached.data = { ...cached.data, ...updates };
      cached.timestamp = Date.now();
      userCache.set(uid, cached);
      console.log('사용자 데이터 캐시 업데이트:', uid);
    }
  } catch (error) {
    console.error('사용자 데이터 업데이트 오류:', error);
    throw error;
  }
};

/**
 * 사용자 데이터 캐시를 무효화합니다.
 */
export const invalidateUserCache = (uid: string): void => {
  userCache.delete(uid);
  console.log('사용자 데이터 캐시 무효화:', uid);
};

/**
 * 모든 사용자 데이터 캐시를 무효화합니다.
 */
export const clearAllUserCache = (): void => {
  userCache.clear();
  console.log('모든 사용자 데이터 캐시 무효화');
};

/**
 * 캐시 상태를 확인합니다 (디버깅용).
 */
export const getCacheStatus = (): { size: number; entries: Array<{ uid: string; expiresAt: number }> } => {
  const entries = Array.from(userCache.entries()).map(([uid, cached]) => ({
    uid,
    expiresAt: cached.expiresAt
  }));
  
  return {
    size: userCache.size,
    entries
  };
};

/**
 * 프로필 이미지 URL을 업데이트합니다.
 */
export const updateProfileImage = async (uid: string, profileImageURL: string): Promise<void> => {
  try {
    await updateUserData(uid, { profileImageURL });
    console.log('프로필 이미지 URL 업데이트 완료:', uid);
  } catch (error) {
    console.error('프로필 이미지 URL 업데이트 오류:', error);
    throw error;
  }
};

/**
 * 프로필 이미지를 제거합니다.
 */
export const removeProfileImage = async (uid: string): Promise<void> => {
  try {
    await updateUserData(uid, { profileImageURL: null });
    console.log('프로필 이미지 제거 완료:', uid);
  } catch (error) {
    console.error('프로필 이미지 제거 오류:', error);
    throw error;
  }
}; 