import React, { useState, useEffect } from 'react';
import { FaEllipsisV, FaFile, FaFileExcel, FaFilePdf, FaFileWord, FaFileAlt, FaComment } from 'react-icons/fa';
import { FiDownload, FiTrash2, FiMessageCircle } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { getUserFiles, deleteFile, FileInfo } from '../services/storageService';
import './FilesPage.css';

const FilesPage: React.FC = () => {
  console.log('FilesPage 컴포넌트 렌더링됨');
  const { currentUser } = useAuth();
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // 파일 목록 불러오기
  useEffect(() => {
    const loadFiles = async () => {
      if (!currentUser) return;
      
      try {
        setIsLoading(true);
        setError(null);
        const userFiles = await getUserFiles(currentUser.uid);
        setFiles(userFiles);
      } catch (err) {
        setError('파일 목록을 불러올 수 없습니다.');
        console.error('파일 로딩 오류:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadFiles();
  }, [currentUser]);

  // 드롭다운 밖 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdownId && !(event.target as Element).closest('.file-actions')) {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdownId]);

  // 검색 필터링
  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 전체 선택/해제
  const toggleSelectAll = () => {
    if (selectedFiles.size === filteredFiles.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(filteredFiles.map(f => f.id)));
    }
  };

  // 개별 파일 선택/해제
  const toggleFileSelection = (fileId: string) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(fileId)) {
      newSelected.delete(fileId);
    } else {
      newSelected.add(fileId);
    }
    setSelectedFiles(newSelected);
  };

  // 파일 삭제
  const handleDeleteFiles = async () => {
    if (selectedFiles.size === 0) return;
    
    if (!confirm(`${selectedFiles.size}개의 파일을 삭제하시겠습니까?`)) return;
    
    try {
      const filesToDelete = files.filter(f => selectedFiles.has(f.id));
      
      for (const file of filesToDelete) {
        await deleteFile(file.path);
      }
      
      // 삭제된 파일들을 목록에서 제거
      setFiles(prev => prev.filter(f => !selectedFiles.has(f.id)));
      setSelectedFiles(new Set());
    } catch (err) {
      alert('파일 삭제에 실패했습니다.');
      console.error('파일 삭제 오류:', err);
    }
  };

  // 개별 파일 삭제
  const handleDeleteSingleFile = async (file: FileInfo) => {
    if (!confirm(`"${file.name}" 파일을 삭제하시겠습니까?`)) return;
    
    try {
      await deleteFile(file.path);
      
      // 삭제된 파일을 목록에서 제거
      setFiles(prev => prev.filter(f => f.id !== file.id));
      
      // 선택된 파일 목록에서도 제거
      if (selectedFiles.has(file.id)) {
        const newSelected = new Set(selectedFiles);
        newSelected.delete(file.id);
        setSelectedFiles(newSelected);
      }
      
      // 드롭다운 닫기
      setOpenDropdownId(null);
    } catch (err) {
      alert('파일 삭제에 실패했습니다.');
      console.error('파일 삭제 오류:', err);
    }
  };

  // 드롭다운 토글
  const toggleDropdown = (fileId: string) => {
    setOpenDropdownId(openDropdownId === fileId ? null : fileId);
  };

  // 파일 다운로드
  const handleDownloadFiles = () => {
    if (selectedFiles.size === 0) return;
    
    const filesToDownload = files.filter(f => selectedFiles.has(f.id));
    
    filesToDownload.forEach(file => {
      const link = document.createElement('a');
      link.href = file.downloadURL;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  // 파일 아이콘 가져오기
  const getFileIcon = (fileType: string) => {
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) {
      return <FaFileExcel className="file-icon excel" />;
    } else if (fileType.includes('pdf')) {
      return <FaFilePdf className="file-icon pdf" />;
    } else if (fileType.includes('word') || fileType.includes('document')) {
      return <FaFileWord className="file-icon word" />;
    } else if (fileType.includes('text') || fileType.includes('csv')) {
      return <FaFileAlt className="file-icon text" />;
    } else {
      return <FaFile className="file-icon default" />;
    }
  };

  // 파일 크기 포맷팅
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 날짜 포맷팅
  const formatDate = (date: Date): string => {
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    
    // 디버깅을 위한 로그
    console.log('파일 업로드 시간:', date.toLocaleString('ko-KR'));
    console.log('현재 시간:', now.toLocaleString('ko-KR'));
    console.log('시간 차이 (일):', diffDays);
    console.log('시간 차이 (시간):', diffHours);
    console.log('시간 차이 (분):', diffMinutes);
    
    if (diffDays === 0) {
      if (diffHours === 0) {
        if (diffMinutes === 0) return 'Just now';
        return `${diffMinutes} minutes ago`;
      }
      return `${diffHours} hours ago`;
    }
    if (diffDays === 1) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays} days ago`;
    if (diffDays <= 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays <= 365) return `${Math.floor(diffDays / 30)} months ago`;
    return date.toLocaleDateString('en-US');
  };

  if (isLoading) {
    return (
      <div className="files-page">
        <div className="files-loading">
          <div className="loading-spinner"></div>
          <p>Loading files...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="files-page">
        <div className="files-error">
          <p>파일 목록을 불러올 수 없습니다.</p>
          <p className="error-details">Firebase Storage 권한 설정이 필요합니다.</p>
          <button onClick={() => window.location.reload()}>다시 시도</button>
        </div>
      </div>
    );
  }

  return (
    <div className="files-page">
      {/* 헤더 */}
      <div className="files-header">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="action-buttons">
          <button 
            className={`action-btn download-btn ${selectedFiles.size === 0 ? 'disabled' : ''}`}
            onClick={handleDownloadFiles}
            disabled={selectedFiles.size === 0}
          >
            <FiDownload />
            Download ({selectedFiles.size})
          </button>
          
          <button 
            className={`action-btn delete-btn ${selectedFiles.size === 0 ? 'disabled' : ''}`}
            onClick={handleDeleteFiles}
            disabled={selectedFiles.size === 0}
          >
            <FiTrash2 />
            Delete ({selectedFiles.size})
          </button>
          
          <button 
            className={`action-btn chat-btn ${selectedFiles.size === 0 ? 'disabled' : ''}`}
            disabled={selectedFiles.size === 0}
          >
            <FiMessageCircle />
            Chat with files ({selectedFiles.size})
          </button>
        </div>
      </div>

      {/* 파일 목록 */}
      <div className="files-table">
        <div className="files-table-scroll">
          <div className="table-header">
            <div className="header-checkbox">
              <input
                type="checkbox"
                checked={selectedFiles.size === filteredFiles.length && filteredFiles.length > 0}
                onChange={toggleSelectAll}
              />
            </div>
            <div className="header-name">Name</div>
            <div className="header-size">Size</div>
            <div className="header-date">Upload Date</div>
            <div className="header-actions">Actions</div>
          </div>

          <div className="table-body">
          {filteredFiles.length === 0 ? (
            <div className="no-files">
              <p>No files uploaded yet.</p>
            </div>
          ) : (
            filteredFiles.map((file) => (
              <div key={file.id} className="file-row">
                <div className="file-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedFiles.has(file.id)}
                    onChange={() => toggleFileSelection(file.id)}
                  />
                </div>
                
                <div className="file-info">
                  {getFileIcon(file.type)}
                  <span className="file-name" title={file.name}>
                    {file.name}
                  </span>
                </div>
                
                <div className="file-size">
                  {formatFileSize(file.size)}
                </div>
                
                <div className="file-date">
                  <span title={file.uploadDate.toLocaleString('en-US')}>
                    {formatDate(file.uploadDate)}
                  </span>
                </div>
                
                <div className="file-actions">
                  <button className="action-icon chat-icon" title="Chat with this file">
                    <FaComment />
                  </button>
                  <button 
                    className="action-icon more-icon" 
                    title="More options"
                    onClick={() => toggleDropdown(file.id)}
                  >
                    <FaEllipsisV />
                  </button>
                  
                  {/* 드롭다운 메뉴 */}
                  {openDropdownId === file.id && (
                    <div className="file-dropdown">
                      <div className="dropdown-item delete" onClick={() => handleDeleteSingleFile(file)}>
                        <FiTrash2 className="dropdown-icon" />
                        <span>Delete</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilesPage; 