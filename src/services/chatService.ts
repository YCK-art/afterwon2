import { doc, setDoc, updateDoc, getDoc, collection, query, orderBy, getDocs, where, writeBatch } from 'firebase/firestore';
import { db } from '../firebase/config';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  file?: {
    name: string;
    size: number;
    type: string;
    content?: string;
  };
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  lastMessageAt: Date;
  fileAttached?: boolean;
  status?: 'active' | 'deleted'; // 상태 필드 추가
}

export const saveChatSession = async (session: ChatSession): Promise<void> => {
  try {
    // 데이터 검증
    if (!session.id || !session.userId || !session.title || !session.messages || !session.createdAt || !session.lastMessageAt) {
      throw new Error('필수 필드가 누락되었습니다.');
    }

    const sessionRef = doc(db, 'chatSessions', session.id);
    const sessionData: any = {
      id: session.id,
      userId: session.userId,
      title: session.title,
      status: session.status || 'active', // 기본값은 'active'
      messages: session.messages.map(msg => {
        const messageData: any = {
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp.toISOString()
        };
        
        // file이 있을 때만 추가
        if (msg.file) {
          messageData.file = {
            name: msg.file.name,
            size: msg.file.size,
            type: msg.file.type
          };
          
          // content가 있을 때만 추가
          if (msg.file.content) {
            messageData.file.content = msg.file.content;
          }
        }
        
        return messageData;
      }),
      createdAt: session.createdAt.toISOString(),
      lastMessageAt: session.lastMessageAt.toISOString()
    };
    
    // fileAttached가 true일 때만 추가
    if (session.fileAttached) {
      sessionData.fileAttached = true;
    }

    // 디버깅: 저장할 데이터 로그
    console.log('Firestore에 저장할 데이터:', JSON.stringify(sessionData, null, 2));

    await setDoc(sessionRef, sessionData);
  } catch (error) {
    console.error('채팅 세션 저장 오류:', error);
    throw new Error('채팅 세션을 저장할 수 없습니다.');
  }
};

export const updateChatSession = async (sessionId: string, updates: Partial<ChatSession>): Promise<void> => {
  try {
    const sessionRef = doc(db, 'chatSessions', sessionId);
    const updateData: any = {};
    
    if (updates.lastMessageAt) {
      updateData.lastMessageAt = updates.lastMessageAt.toISOString();
    }
    
    if (updates.messages) {
      updateData.messages = updates.messages.map(msg => {
        const messageData: any = {
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp.toISOString()
        };
        
        // file이 있을 때만 추가
        if (msg.file) {
          messageData.file = {
            name: msg.file.name,
            size: msg.file.size,
            type: msg.file.type
          };
          
          // content가 있을 때만 추가
          if (msg.file.content) {
            messageData.file.content = msg.file.content;
          }
        }
        
        return messageData;
      });
    }
    
    if (updates.title) {
      updateData.title = updates.title;
    }
    
    if (updates.fileAttached !== undefined) {
      updateData.fileAttached = updates.fileAttached;
    }
    
    await updateDoc(sessionRef, updateData);
  } catch (error) {
    console.error('채팅 세션 업데이트 오류:', error);
    throw new Error('채팅 세션을 업데이트할 수 없습니다.');
  }
};

export const updateChatSessionStatus = async (sessionId: string, status: 'active' | 'deleted'): Promise<void> => {
  try {
    const sessionRef = doc(db, 'chatSessions', sessionId);
    await updateDoc(sessionRef, { status });
  } catch (error) {
    console.error('채팅 세션 상태 업데이트 오류:', error);
    throw new Error('채팅 세션 상태를 업데이트할 수 없습니다.');
  }
};

// 기존 채팅 세션들에 status 필드 추가 (마이그레이션)
export const migrateExistingChatSessions = async (userId: string): Promise<void> => {
  try {
    const sessionsRef = collection(db, 'chatSessions');
    const q = query(
      sessionsRef,
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    const batch = writeBatch(db);
    
    querySnapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      // status 필드가 없는 경우에만 'active'로 설정
      if (!data.status) {
        const sessionRef = doc(db, 'chatSessions', docSnapshot.id);
        batch.update(sessionRef, { status: 'active' });
      }
    });
    
    await batch.commit();
    console.log('기존 채팅 세션 마이그레이션 완료');
  } catch (error) {
    console.error('채팅 세션 마이그레이션 오류:', error);
    throw new Error('기존 채팅 세션을 마이그레이션할 수 없습니다.');
  }
};

export const getUserChatSessions = async (userId: string): Promise<ChatSession[]> => {
  try {
    const sessionsRef = collection(db, 'chatSessions');
    const q = query(
      sessionsRef,
      where('userId', '==', userId)
      // status 필터링 제거 - 모든 세션을 가져온 후 클라이언트에서 필터링
    );
    
    const querySnapshot = await getDocs(q);
    const sessions: ChatSession[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // status가 'deleted'가 아닌 세션만 필터링 (클라이언트에서)
      if (data.status !== 'deleted') {
        sessions.push({
          ...data,
          id: doc.id,
          status: data.status || 'active', // 기본값은 'active'
          createdAt: new Date(data.createdAt),
          lastMessageAt: new Date(data.lastMessageAt),
          messages: data.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        } as ChatSession);
      }
    });
    
    // 클라이언트에서 정렬
    return sessions.sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime());
  } catch (error) {
    console.error('사용자 채팅 세션 가져오기 오류:', error);
    throw new Error('채팅 세션을 가져올 수 없습니다.');
  }
};

export const getChatSession = async (sessionId: string): Promise<ChatSession | null> => {
  try {
    const sessionRef = doc(db, 'chatSessions', sessionId);
    const sessionDoc = await getDoc(sessionRef);
    
    if (sessionDoc.exists()) {
      const data = sessionDoc.data();
      return {
        ...data,
        id: sessionDoc.id,
        createdAt: new Date(data.createdAt),
        lastMessageAt: new Date(data.lastMessageAt),
        messages: data.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      } as ChatSession;
    }
    
    return null;
  } catch (error) {
    console.error('채팅 세션 가져오기 오류:', error);
    throw new Error('채팅 세션을 가져올 수 없습니다.');
  }
}; 