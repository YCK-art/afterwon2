import { ref, uploadBytes, getDownloadURL, deleteObject, listAll, getMetadata } from 'firebase/storage';
import { storage } from '../firebase/config';

export interface FileInfo {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadDate: Date;
  downloadURL: string;
  path: string;
}

export interface UploadedFile {
  name: string;
  size: number;
  type: string;
  content?: string;
}

/**
 * 파일을 Firebase Storage에 업로드
 */
export const uploadFileToStorage = async (
  file: File, 
  userId: string, 
  chatSessionId?: string
): Promise<FileInfo> => {
  try {
    // 파일 경로 설정
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name}`;
    const filePath = chatSessionId 
      ? `users/${userId}/chats/${chatSessionId}/${fileName}`
      : `users/${userId}/files/${fileName}`;
    
    const storageRef = ref(storage, filePath);
    
    // 파일 업로드
    const snapshot = await uploadBytes(storageRef, file);
    
    // 다운로드 URL 가져오기
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    // 파일 메타데이터 가져오기
    const metadata = await getMetadata(snapshot.ref);
    
    const fileInfo: FileInfo = {
      id: snapshot.ref.name,
      name: file.name,
      size: file.size,
      type: file.type,
      uploadDate: new Date(metadata.timeCreated),
      downloadURL,
      path: filePath
    };
    
    return fileInfo;
  } catch (error) {
    console.error('파일 업로드 실패:', error);
    throw new Error('파일 업로드에 실패했습니다.');
  }
};

/**
 * 사용자의 모든 파일 목록 가져오기
 */
export const getUserFiles = async (userId: string): Promise<FileInfo[]> => {
  try {
    const filesRef = ref(storage, `users/${userId}/files`);
    const result = await listAll(filesRef);
    
    const files: FileInfo[] = [];
    
    for (const itemRef of result.items) {
      try {
        const metadata = await getMetadata(itemRef);
        const downloadURL = await getDownloadURL(itemRef);
        
        const fileInfo: FileInfo = {
          id: itemRef.name,
          name: metadata.name || itemRef.name,
          size: metadata.size || 0,
          type: metadata.contentType || 'application/octet-stream',
          uploadDate: new Date(metadata.timeCreated),
          downloadURL,
          path: itemRef.fullPath
        };
        
        files.push(fileInfo);
      } catch (error) {
        console.error('파일 메타데이터 가져오기 실패:', error);
      }
    }
    
    // 업로드 날짜순으로 정렬 (최신순)
    return files.sort((a, b) => b.uploadDate.getTime() - a.uploadDate.getTime());
  } catch (error) {
    console.error('파일 목록 가져오기 실패:', error);
    
    // Firebase 권한 오류인 경우 더 구체적인 메시지 제공
    if (error instanceof Error && error.message.includes('unauthorized')) {
      throw new Error('Firebase Storage 권한이 설정되지 않았습니다. 관리자에게 문의하세요.');
    }
    
    throw new Error('파일 목록을 가져올 수 없습니다.');
  }
};

/**
 * 파일 삭제
 */
export const deleteFile = async (filePath: string): Promise<void> => {
  try {
    const fileRef = ref(storage, filePath);
    await deleteObject(fileRef);
  } catch (error) {
    console.error('파일 삭제 실패:', error);
    throw new Error('파일 삭제에 실패했습니다.');
  }
};

/**
 * 파일 다운로드 URL 가져오기
 */
export const getFileDownloadURL = async (filePath: string): Promise<string> => {
  try {
    const fileRef = ref(storage, filePath);
    return await getDownloadURL(fileRef);
  } catch (error) {
    console.error('다운로드 URL 가져오기 실패:', error);
    throw new Error('파일 다운로드 URL을 가져올 수 없습니다.');
  }
};

/**
 * 프로필 이미지 업로드
 */
export const uploadProfileImage = async (
  file: File, 
  userId: string
): Promise<string> => {
  try {
    // 프로필 이미지 경로 설정
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `profile_${timestamp}.${fileExtension}`;
    const filePath = `users/${userId}/profile/${fileName}`;
    
    const storageRef = ref(storage, filePath);
    
    // 파일 업로드
    await uploadBytes(storageRef, file);
    
    // 다운로드 URL 가져오기
    const downloadURL = await getDownloadURL(storageRef);
    
    return downloadURL;
  } catch (error) {
    console.error('프로필 이미지 업로드 실패:', error);
    throw new Error('프로필 이미지 업로드에 실패했습니다.');
  }
};

/**
 * 프로필 이미지 삭제
 */
export const deleteProfileImage = async (userId: string): Promise<void> => {
  try {
    // 프로필 이미지 폴더의 모든 파일 삭제
    const profileRef = ref(storage, `users/${userId}/profile`);
    const result = await listAll(profileRef);
    
    // 모든 프로필 이미지 파일 삭제
    const deletePromises = result.items.map(itemRef => deleteObject(itemRef));
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('프로필 이미지 삭제 실패:', error);
    throw new Error('프로필 이미지 삭제에 실패했습니다.');
  }
}; 