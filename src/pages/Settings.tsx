import React, { useState, useRef, useEffect } from 'react';
import { FiUpload, FiTrash2 } from 'react-icons/fi';
import { uploadProfileImage, deleteProfileImage } from '../services/storageService';
import { getCachedProfileImageUrl, removeProfileImageFromCache } from '../utils/imageCache';
import './Settings.css';

interface SettingsProps {
  onBack: () => void;
  profileInitials: string;
  profileBackgroundColor: string;
  displayName: string;
  userId: string;
  initialProfileImageURL?: string;
  onProfileImageUpdate: (imageURL: string | null) => void;
}

const Settings: React.FC<SettingsProps> = ({ onBack, profileInitials, profileBackgroundColor, displayName, userId, initialProfileImageURL, onProfileImageUpdate }) => {
  const [activeTab, setActiveTab] = useState<'settings' | 'members' | 'billing'>('settings');
  const [workspaceName, setWorkspaceName] = useState(displayName);
  const [defaultGenerationName, setDefaultGenerationName] = useState('e.g. "$Prompt image - $Date"');
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempWorkspaceName, setTempWorkspaceName] = useState(displayName);
  const [profileImageURL, setProfileImageURL] = useState<string | null>(initialProfileImageURL || null);
  const [cachedImageURL, setCachedImageURL] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // initialProfileImageURL이 변경될 때 로컬 상태 업데이트
  useEffect(() => {
    console.log('Settings: initialProfileImageURL 변경됨:', initialProfileImageURL);
    setProfileImageURL(initialProfileImageURL || null);
  }, [initialProfileImageURL]);

  // profileImageURL 상태 변경 시 캐시된 URL 생성
  useEffect(() => {
    console.log('Settings: profileImageURL 상태 변경됨:', profileImageURL);
    
    if (profileImageURL) {
      // 이미지 캐싱 및 캐시된 URL 생성
      getCachedProfileImageUrl(profileImageURL).then(cachedURL => {
        setCachedImageURL(cachedURL);
        console.log('Settings: 캐시된 이미지 URL 생성됨:', cachedURL);
      }).catch(error => {
        console.error('Settings: 이미지 캐싱 실패:', error);
        setCachedImageURL(profileImageURL); // 캐싱 실패 시 원본 URL 사용
      });
    } else {
      setCachedImageURL(null);
    }
  }, [profileImageURL]);

  const handleNameEdit = () => {
    setIsEditingName(true);
    setTempWorkspaceName(workspaceName);
  };

  const handleNameConfirm = () => {
    setWorkspaceName(tempWorkspaceName);
    setIsEditingName(false);
  };

  const handleNameCancel = () => {
    setTempWorkspaceName(workspaceName);
    setIsEditingName(false);
  };

  const handleClearGenerationName = () => {
    setDefaultGenerationName('');
  };

  const handleProfileImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('Settings: 프로필 이미지 업로드 시작:', file.name, file.size);

    // 파일 유효성 검사
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드할 수 있습니다.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB 제한
      alert('파일 크기는 5MB 이하여야 합니다.');
      return;
    }

    setIsUploading(true);
    try {
      console.log('Settings: Firebase Storage 업로드 시작...');
      // Firebase Storage에 업로드
      const imageURL = await uploadProfileImage(file, userId);
      console.log('Settings: Firebase Storage 업로드 완료, URL:', imageURL);
      
      // 로컬 상태 업데이트
      console.log('Settings: 로컬 상태 업데이트:', imageURL);
      setProfileImageURL(imageURL);
      
      // 부모 컴포넌트에 알림 (AuthContext를 통해 처리됨)
      console.log('Settings: 부모 컴포넌트에 알림 시작...');
      await onProfileImageUpdate(imageURL);
      console.log('Settings: 부모 컴포넌트 알림 완료');
      
      alert('프로필 이미지가 성공적으로 업로드되었습니다.');
    } catch (error) {
      console.error('Settings: 프로필 이미지 업로드 실패:', error);
      alert('프로필 이미지 업로드에 실패했습니다.');
    } finally {
      setIsUploading(false);
      // 파일 input 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleProfileImageDelete = async () => {
    if (!profileImageURL) return;

    if (!confirm('프로필 이미지를 삭제하시겠습니까?')) return;

    try {
      // Firebase Storage에서 이미지 삭제
      await deleteProfileImage(userId);
      
      // 캐시에서 이미지 제거
      if (profileImageURL) {
        removeProfileImageFromCache(profileImageURL);
      }
      
      // 로컬 상태 업데이트
      setProfileImageURL(null);
      setCachedImageURL(null);
      
      // 부모 컴포넌트에 알림 (AuthContext를 통해 처리됨)
      onProfileImageUpdate(null);
      
      alert('프로필 이미지가 삭제되었습니다.');
    } catch (error) {
      console.error('프로필 이미지 삭제 실패:', error);
      alert('프로필 이미지 삭제에 실패했습니다.');
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };



  return (
    <div className="settings-page">
      {/* 상단 헤더 */}
      <div className="settings-header">
        <div className="workspace-info">
          {cachedImageURL ? (
            <div className="workspace-logo">
              <img 
                src={cachedImageURL} 
                alt="Profile" 
                className="profile-image"
              />
            </div>
          ) : (
            <div className="workspace-logo" style={{ backgroundColor: profileBackgroundColor }}>
              <span className="workspace-initials">{profileInitials}</span>
            </div>
          )}
          <span className="workspace-name">{displayName}</span>
        </div>
        
        {/* 탭 네비게이션 */}
        <div className="settings-tabs">
          <button 
            className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </button>
          <button 
            className={`tab ${activeTab === 'members' ? 'active' : ''}`}
            onClick={() => setActiveTab('members')}
          >
            Members
          </button>
          <button 
            className={`tab ${activeTab === 'billing' ? 'active' : ''}`}
            onClick={() => setActiveTab('billing')}
          >
            Plans & Billing
          </button>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="settings-content">
        {activeTab === 'settings' && (
          <div className="settings-section">
            {/* 워크스페이스 로고 */}
            <div className="setting-item">
              <h3>Workspace logo</h3>
              <div className="logo-section">
                {cachedImageURL ? (
                  <div className="current-logo">
                    <img 
                      src={cachedImageURL} 
                      alt="Profile" 
                      className="profile-image"
                    />
                  </div>
                ) : (
                  <div className="current-logo" style={{ backgroundColor: profileBackgroundColor }}>
                    <span className="logo-initials">{profileInitials}</span>
                  </div>
                )}
                <div className="logo-actions">
                  <button 
                    className="upload-btn" 
                    onClick={handleUploadClick}
                    disabled={isUploading}
                  >
                    <FiUpload />
                    {isUploading ? 'Uploading...' : 'Upload logo'}
                  </button>
                  {profileImageURL && (
                    <button 
                      className="delete-btn" 
                      onClick={handleProfileImageDelete}
                    >
                      Remove
                    </button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleProfileImageUpload}
                  style={{ display: 'none' }}
                />
              </div>
              <p className="upload-hint">Min. 200x200px, .PNG or .JPG</p>
            </div>

            {/* 워크스페이스 이름 */}
            <div className="setting-item">
              <h3>Workspace name</h3>
              {isEditingName ? (
                <div className="name-edit-section">
                  <input
                    type="text"
                    value={tempWorkspaceName}
                    onChange={(e) => setTempWorkspaceName(e.target.value)}
                    className="name-input"
                  />
                  <div className="name-actions">
                    <button className="cancel-btn" onClick={handleNameCancel}>
                      Cancel
                    </button>
                    <button 
                      className="confirm-btn" 
                      onClick={handleNameConfirm}
                      disabled={!tempWorkspaceName.trim()}
                    >
                      Confirm
                    </button>
                  </div>
                </div>
              ) : (
                <div className="name-display-section">
                  <span className="current-name">{workspaceName}</span>
                  <button className="edit-btn" onClick={handleNameEdit}>
                    Edit
                  </button>
                </div>
              )}
            </div>

            {/* 기본 생성 이름 */}
            <div className="setting-item no-border">
              <h3>Default generation name</h3>
              <div className="generation-name-section">
                <input
                  type="text"
                  value={defaultGenerationName}
                  onChange={(e) => setDefaultGenerationName(e.target.value)}
                  className="generation-name-input"
                  placeholder="e.g. $Prompt image - $Date"
                />
                <button className="clear-btn" onClick={handleClearGenerationName}>
                  Clear
                </button>
              </div>
            </div>


          </div>
        )}

        {activeTab === 'members' && (
          <div className="members-section">
            <h3>Members</h3>
            <p>멤버 관리 기능이 여기에 표시됩니다.</p>
          </div>
        )}

        {activeTab === 'billing' && (
          <div className="billing-section">
            <h3>Plans & Billing</h3>
            <p>요금제 및 결제 정보가 여기에 표시됩니다.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings; 