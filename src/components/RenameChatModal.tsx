import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import './RenameChatModal.css';

interface RenameChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTitle: string;
  onRename: (newTitle: string) => Promise<void>;
}

const RenameChatModal: React.FC<RenameChatModalProps> = ({
  isOpen,
  onClose,
  currentTitle,
  onRename
}) => {
  const [newTitle, setNewTitle] = useState(currentTitle);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNewTitle(currentTitle);
    }
  }, [isOpen, currentTitle]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsLoading(true);
    try {
      await onRename(newTitle.trim());
      onClose();
    } catch (error) {
      console.error('채팅 이름 변경 실패:', error);
      alert('채팅 이름 변경에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="rename-modal-overlay" onClick={onClose}>
      <div className="rename-modal" onClick={(e) => e.stopPropagation()}>
        <div className="rename-modal-header">
          <h3 className="rename-modal-title">Rename chat</h3>
          <button className="rename-modal-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="rename-modal-form">
          <div className="rename-input-container">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter new chat name"
              className="rename-input"
              autoFocus
              disabled={isLoading}
            />
          </div>
          
          <div className="rename-modal-actions">
            <button
              type="button"
              className="rename-btn cancel-btn"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rename-btn save-btn"
              disabled={!newTitle.trim() || isLoading}
            >
              {isLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RenameChatModal; 