import React, { useState, useEffect } from 'react';
import { FaTimes, FaSearch, FaComment } from 'react-icons/fa';
import './ChatSearchModal.css';

interface ChatSession {
  id: string;
  title: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  createdAt: Date;
  lastMessageAt: Date;
}

interface ChatSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatSessions: ChatSession[];
  onSelectChat: (sessionId: string) => void;
  truncateTitle: (title: string, maxLength?: number) => string;
}

const ChatSearchModal: React.FC<ChatSearchModalProps> = ({
  isOpen,
  onClose,
  chatSessions,
  onSelectChat,
  truncateTitle
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredSessions, setFilteredSessions] = useState<ChatSession[]>([]);

  // 검색어에 따라 채팅 세션 필터링
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSessions(chatSessions);
      return;
    }

    const filtered = chatSessions.filter(session => {
      const titleMatch = session.title.toLowerCase().includes(searchQuery.toLowerCase());
      const contentMatch = session.messages.some(message => 
        message.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
      return titleMatch || contentMatch;
    });

    setFilteredSessions(filtered);
  }, [searchQuery, chatSessions]);

  // 날짜별로 그룹화
  const groupSessionsByDate = (sessions: ChatSession[]) => {
    const now = new Date();
    const lastWeek = new Date(now);
    lastWeek.setDate(lastWeek.getDate() - 7);

    const groups = {
      today: [] as ChatSession[],
      lastWeek: [] as ChatSession[],
      older: [] as ChatSession[]
    };

    sessions.forEach(session => {
      const sessionDate = new Date(session.lastMessageAt);
      
      if (sessionDate.toDateString() === now.toDateString()) {
        groups.today.push(session);
      } else if (sessionDate > lastWeek) {
        groups.lastWeek.push(session);
      } else {
        groups.older.push(session);
      }
    });

    return groups;
  };

  const groupedSessions = groupSessionsByDate(filteredSessions);

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return '오늘';
    if (diffDays === 1) return '어제';
    if (diffDays <= 7) return '지난 7일';
    return date.toLocaleDateString('ko-KR');
  };

  if (!isOpen) return null;

  return (
    <div className="chat-search-modal-overlay" onClick={onClose}>
      <div className="chat-search-modal" onClick={(e) => e.stopPropagation()}>
        {/* 헤더 */}
        <div className="modal-header">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        {/* 구분선 */}
        <div className="modal-divider"></div>

        {/* 내용 */}
        <div className="modal-content">
          {/* 채팅 히스토리 */}
          {Object.entries(groupedSessions).map(([groupKey, sessions]) => {
            if (sessions.length === 0) return null;
            
            return (
              <div key={groupKey} className="chat-group">
                <div className="group-header">
                  {groupKey === 'today' && 'Today'}
                  {groupKey === 'lastWeek' && 'Last 7 days'}
                  {groupKey === 'older' && 'Earlier'}
                </div>
                {sessions.map((session) => (
                  <button
                    key={session.id}
                    className="chat-history-item"
                    onClick={() => {
                      onSelectChat(session.id);
                      onClose();
                    }}
                  >
                    <FaComment className="chat-icon" />
                    <span className="chat-title" title={session.title}>
                      {truncateTitle(session.title)}
                    </span>
                  </button>
                ))}
              </div>
            );
          })}

          {/* 검색 결과가 없을 때 */}
          {searchQuery && filteredSessions.length === 0 && (
            <div className="no-results">
              <p>No search results found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatSearchModal; 