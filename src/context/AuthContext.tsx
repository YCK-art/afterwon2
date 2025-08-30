import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db } from '../firebase/config';
import { getUserData, updateUserData, invalidateUserCache } from '../services/userService';

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

interface AuthContextType {
  currentUser: User | null;
  userData: UserData | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  fetchUserData: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  updateProfileImage: (imageURL: string | null) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async () => {
    if (currentUser) {
      try {
        console.log('사용자 데이터 가져오기 시작:', currentUser.uid);
        
        // 새로운 userService 사용 (24시간 캐싱 포함)
        const userData = await getUserData(currentUser.uid);
        
        if (userData) {
          console.log('사용자 데이터 로드 완료:', userData.displayName);
          setUserData(userData);
        } else {
          console.log('Firestore에 사용자 데이터가 없음, 새로 생성');
          // 사용자 데이터가 없으면 새로 생성
          await saveUserToFirestore(currentUser);
          // 생성 후 다시 가져오기
          await fetchUserData();
        }
      } catch (error) {
        console.error('사용자 데이터 가져오기 오류:', error);
      }
    } else {
      console.log('currentUser가 없어서 사용자 데이터를 가져올 수 없음');
    }
  };

  const refreshUserData = async () => {
    if (currentUser) {
      try {
        console.log('사용자 데이터 강제 새로고침:', currentUser.uid);
        // 캐시 무효화 후 새로 가져오기
        invalidateUserCache(currentUser.uid);
        await fetchUserData();
      } catch (error) {
        console.error('사용자 데이터 새로고침 오류:', error);
      }
    }
  };

  const updateProfileImage = async (imageURL: string | null) => {
    if (currentUser) {
      try {
        console.log('AuthContext: 프로필 이미지 업데이트 시작:', imageURL);
        
        if (imageURL) {
          // 프로필 이미지 URL 저장
          console.log('AuthContext: Firestore에 프로필 이미지 URL 저장 중...');
          await updateUserData(currentUser.uid, { profileImageURL: imageURL });
          console.log('AuthContext: Firestore 저장 완료');
        } else {
          // 프로필 이미지 제거
          console.log('AuthContext: Firestore에서 프로필 이미지 URL 제거 중...');
          await updateUserData(currentUser.uid, { profileImageURL: null });
          console.log('AuthContext: Firestore 제거 완료');
        }
        
        // 로컬 상태 업데이트
        console.log('AuthContext: 로컬 상태 업데이트 시작...');
        setUserData(prev => {
          const newData = prev ? { ...prev, profileImageURL: imageURL || undefined } : null;
          console.log('AuthContext: 새로운 userData:', newData);
          return newData;
        });
        
        console.log('AuthContext: 프로필 이미지 업데이트 완료');
      } catch (error) {
        console.error('AuthContext: 프로필 이미지 업데이트 오류:', error);
        throw error;
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setLoading(false);
      
      // 사용자가 로그인 상태일 때 사용자 데이터 가져오기
      if (user) {
        console.log('사용자 로그인됨:', user.displayName, user.email);
        // 사용자 데이터 가져오기
        await fetchUserData();
        
        const updateLastSeen = async () => {
          try {
            // 새로운 userService 사용
            await updateUserData(user.uid, {});
          } catch (error) {
            console.error('lastSeenAt 업데이트 오류:', error);
          }
        };
        
        // 5분마다 lastSeenAt 업데이트
        const interval = setInterval(updateLastSeen, 5 * 60 * 1000);
        
        // 컴포넌트 언마운트 시 인터벌 정리
        return () => clearInterval(interval);
      } else {
        console.log('사용자 로그아웃됨');
        setUserData(null);
      }
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await saveUserToFirestore(result.user);
    } catch (error) {
      console.error('Google 로그인 오류:', error);
      throw error;
    }
  };

  const saveUserToFirestore = async (user: User) => {
    try {
      console.log('사용자 정보 Firestore 저장 시작:', user.displayName, user.email);
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        // 기존 사용자: 로그인 횟수와 마지막 로그인 시간 업데이트
        console.log('기존 사용자 정보 업데이트');
        await updateUserData(user.uid, {
          lastLoginAt: serverTimestamp(),
          loginCount: (userDoc.data().loginCount || 0) + 1
        });
      } else {
        // 새 사용자: 모든 정보 저장
        console.log('새 사용자 정보 저장');
        const userData = {
          uid: user.uid,
          displayName: user.displayName || 'Unknown User',
          email: user.email,
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
          loginCount: 1,
          lastSeenAt: serverTimestamp()
        };
        console.log('저장할 사용자 데이터:', userData);
        await setDoc(userRef, userData);
        
        // 새로 생성된 사용자 데이터를 로컬 상태에 설정
        setUserData(userData);
      }
      console.log('사용자 정보 저장 완료');
    } catch (error) {
      console.error('사용자 정보 저장 오류:', error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('로그아웃 오류:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    currentUser,
    userData,
    loading,
    signInWithGoogle,
    logout,
    fetchUserData,
    refreshUserData,
    updateProfileImage,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 