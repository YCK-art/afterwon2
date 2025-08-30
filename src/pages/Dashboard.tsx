import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaPlus, FaSearch, FaFile, FaChartBar, FaMagic, FaArrowUp, FaCaretUp, FaCheck, FaEllipsisV, FaTrash, FaMicrophone, FaGlobe, FaCog, FaBrain, FaMemory, FaFilePdf, FaFileCsv, FaFileExcel, FaFileWord } from 'react-icons/fa';
import { FiStar, FiEdit3 } from 'react-icons/fi';
import { FiDownload, FiMaximize2 } from 'react-icons/fi';
import { FiSidebar, FiSettings, FiLogOut, FiRefreshCw, FiCopy, FiType, FiMousePointer, FiChevronDown } from 'react-icons/fi';
import { sendMessageToChatGPT, ChatMessage as APIChatMessage } from '../services/openaiService';
import { readFileContent, validateFile, getExcelSheetNames, extractExcelSheetAsCsv } from '../services/fileService';
import { saveChatSession, updateChatSession, getUserChatSessions, updateChatSessionStatus, migrateExistingChatSessions } from '../services/chatService';
import { uploadFileToStorage } from '../services/storageService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import ChatSearchModal from '../components/ChatSearchModal';
import RenameChatModal from '../components/RenameChatModal';
import FilesPage from '../components/FilesPage';
import InteractiveTable from '../components/InteractiveTable';
import Settings from './Settings';
import { extractTableFromAIResponse, TableData } from '../utils/tableParser';
import { getCachedProfileImageUrl, removeProfileImageFromCache } from '../utils/imageCache';


import './Dashboard.css';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  files?: Array<{
    name: string;
    size: number;
    type: string;
    content?: string;
    sheetNames?: string[]; // Excel 시트 이름 배열
  }>;
  isCopied?: boolean;
  isTyping?: boolean; // 타이핑 효과를 위한 플래그
}

interface ChatSession {
  id: string;
  userId: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  lastMessageAt: Date;
  fileAttached?: boolean;
}

// 타이핑 효과를 위한 컴포넌트
const TypingMessage: React.FC<{ content: string; onComplete: () => void; onTypingUpdate?: () => void }> = ({ content, onComplete, onTypingUpdate }) => {
  const [displayedContent, setDisplayedContent] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < content.length) {
      const timer = setTimeout(() => {
        setDisplayedContent(prev => prev + content[currentIndex]);
        setCurrentIndex(prev => prev + 1);
        // 타이핑 중에도 스크롤 업데이트
        if (onTypingUpdate) {
          onTypingUpdate();
        }
      }, 30); // 타이핑 속도 조절

      return () => clearTimeout(timer);
    } else {
      onComplete();
    }
  }, [currentIndex, content, onComplete, onTypingUpdate]);

  return (
    <div className="typing-message">
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({node, ...props}) => <h1 style={{fontSize: '2em', fontWeight: 'bold', margin: '0.5em 0'}} {...props} />,
          h2: ({node, ...props}) => <h2 style={{fontSize: '1.5em', fontWeight: 'bold', margin: '0.4em 0'}} {...props} />,
          h3: ({node, ...props}) => <h3 style={{fontSize: '1.3em', fontWeight: 'bold', margin: '0.3em 0'}} {...props} />,
          p: ({node, ...props}) => <p style={{margin: '0.8em 0', lineHeight: '1.6'}} {...props} />,
          strong: ({node, ...props}) => <strong style={{fontWeight: 'bold'}} {...props} />,
          em: ({node, ...props}) => <em style={{fontStyle: 'italic'}} {...props} />,
          code: ({node, ...props}) => <code style={{backgroundColor: '#f4f4f4', padding: '0.2em 0.4em', borderRadius: '3px', fontFamily: 'SpaceMono-Regular, monospace'}} {...props} />,
          pre: ({node, ...props}) => <pre style={{backgroundColor: '#f4f4f4', padding: '1em', borderRadius: '5px', overflow: 'auto', fontFamily: 'SpaceMono-Regular, monospace'}} {...props} />,
          blockquote: ({node, ...props}) => <blockquote style={{borderLeft: '4px solid #ddd', margin: '1em 0', paddingLeft: '1em', fontStyle: 'italic'}} {...props} />,
          ul: ({node, ...props}) => <ul style={{margin: '0.8em 0', paddingLeft: '2em'}} {...props} />,
          ol: ({node, ...props}) => <ol style={{margin: '0.8em 0', paddingLeft: '2em'}} {...props} />,
          li: ({node, ...props}) => <li style={{margin: '0.3em 0'}} {...props} />,
          table: ({node, ...props}) => <table style={{borderCollapse: 'collapse', width: 'auto', margin: '1em 0', border: '1px solid #ddd', minWidth: 'fit-content'}} {...props} />,
          thead: ({node, ...props}) => <thead style={{backgroundColor: '#2a2a2a'}} {...props} />,
          tbody: ({node, ...props}) => <tbody {...props} />,
          tr: ({node, ...props}) => <tr style={{borderBottom: '1px solid #ddd'}} {...props} />,
          th: ({node, ...props}) => <th style={{border: '1px solid #ddd', padding: '8px 12px', textAlign: 'left', backgroundColor: '#2a2a2a', color: '#ffffff', fontWeight: 'bold', whiteSpace: 'nowrap'}} {...props} />,
          td: ({node, ...props}) => <td style={{border: '1px solid #ddd', padding: '8px 12px', textAlign: 'left', whiteSpace: 'nowrap'}} {...props} />,
        }}
      >
        {displayedContent}
      </ReactMarkdown>
      {currentIndex < content.length && <span className="typing-cursor">|</span>}
    </div>
  );
};

// AI 메시지 렌더러 컴포넌트
const AIMessageRenderer: React.FC<{ content: string; files?: Array<{ name: string; size: number; type: string; content?: string; sheetNames?: string[] }> }> = ({ content, files }) => {
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [processedContent, setProcessedContent] = useState<string>('');

  // 채팅창에서 시트 선택 처리
  const handleSheetSelectionFromChat = async (file: any, sheetName: string) => {
    try {
      console.log('시트 선택 시 전달된 file 객체:', file);
      console.log('file 객체 타입:', typeof file);
      console.log('file 객체 키들:', Object.keys(file));
      
      // file 객체가 실제 File 객체가 아닌 경우를 처리
      if (!file.arrayBuffer) {
        console.log('file.arrayBuffer가 없습니다. 파일 정보만 표시합니다.');
        alert(`"${sheetName}" 시트가 선택되었습니다. 이제 해당 시트에 대해 분석을 요청해주세요.`);
        return;
      }
      
      // 선택된 시트의 내용을 읽어서 AI 분석 요청
      const content = await extractExcelSheetAsCsv(file, sheetName);
      
      // 새로운 메시지로 시트 선택 요청 전송
      const sheetSelectionMessage = `파일 "${file.name}"의 "${sheetName}" 시트를 분석해주세요.`;
      
      console.log(`시트 "${sheetName}" 선택됨:`, file.name);
      console.log('선택된 시트 내용:', content.substring(0, 200) + '...');
      
      // 사용자에게 안내
      alert(`"${sheetName}" 시트가 선택되었습니다. 이제 해당 시트에 대해 분석을 요청해주세요.`);
    } catch (error) {
      console.error('시트 처리 오류:', error);
      alert(`시트 "${sheetName}" 처리 중 오류가 발생했습니다: ${(error as Error).message}`);
    }
  };

  useEffect(() => {
    // 테이블 데이터 추출
    const extractedTable = extractTableFromAIResponse(content);
    console.log('Extracted table data:', extractedTable); // 디버깅용 로그
    
    if (extractedTable) {
      console.log('Headers:', extractedTable.headers);
      console.log('Rows:', extractedTable.rows);
      
      // 컬럼과 행 데이터 생성
      const columns = getTableColumns(extractedTable);
      const rows = getTableRows(extractedTable);
      
      console.log('Generated columns:', columns);
      console.log('Generated rows:', rows);
    }
    
    setTableData(extractedTable);
    
    // 테이블이 있으면 테이블 부분을 제거한 텍스트 생성
    if (extractedTable) {
      // 테이블 패턴을 찾아서 제거
      const tablePattern = /(\|[^\n]*\|[^\n]*\n)+/;
      const cleanedContent = content.replace(tablePattern, '');
      setProcessedContent(cleanedContent.trim());
    } else {
      setProcessedContent(content);
    }
  }, [content]);

  // 테이블 데이터를 Interactive 테이블용 컬럼 정의로 변환
  const getTableColumns = (data: TableData) => {
    return data.headers.map((header, index) => ({
      accessorKey: `col${index}`,
      header: header,
      cell: ({ row }: any) => {
        const value = row.getValue(`col${index}`);
        return <span className="table-cell-content">{value || ''}</span>;
      },
      enableSorting: true,
    }));
  };

  // 테이블 데이터를 Interactive 테이블용 행 데이터로 변환
  const getTableRows = (data: TableData) => {
    console.log('Original rows:', data.rows);
    
    const processedRows = data.rows.map((row, rowIndex) => {
      const rowData: any = {};
      row.forEach((cell, cellIndex) => {
        rowData[`col${cellIndex}`] = cell || '';
      });
      console.log(`Row ${rowIndex}:`, rowData);
      return rowData;
    });
    
    console.log('Processed rows:', processedRows);
    return processedRows;
  };

  return (
    <>
      {/* 테이블이 있으면 Interactive 테이블로 렌더링 */}
      {tableData && (
        <div className="ai-table-container">
          <InteractiveTable
            data={getTableRows(tableData)}
            columns={getTableColumns(tableData)}
            title={tableData.title}
          />
        </div>
      )}
      

      
      {/* 나머지 텍스트는 ReactMarkdown으로 렌더링 */}
      {processedContent && (
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({node, ...props}) => <h1 style={{fontSize: '2em', fontWeight: 'bold', margin: '0.5em 0'}} {...props} />,
            h2: ({node, ...props}) => <h2 style={{fontSize: '1.5em', fontWeight: 'bold', margin: '0.4em 0'}} {...props} />,
            h3: ({node, ...props}) => <h3 style={{fontSize: '1.3em', fontWeight: 'bold', margin: '0.3em 0'}} {...props} />,
            p: ({node, ...props}) => <p style={{margin: '0.8em 0', lineHeight: '1.6'}} {...props} />,
            strong: ({node, ...props}) => <strong style={{fontWeight: 'bold'}} {...props} />,
            em: ({node, ...props}) => <em style={{fontStyle: 'italic'}} {...props} />,
            code: ({node, ...props}) => <code style={{backgroundColor: '#f4f4f4', padding: '0.2em 0.4em', borderRadius: '3px', fontFamily: 'SpaceMono-Regular, monospace'}} {...props} />,
            pre: ({node, ...props}) => {
              const CodeBlockWithCopy = () => {
                const [isCopied, setIsCopied] = useState(false);
                const codeContent = (node as any)?.children?.[0]?.children?.[0]?.value || '';
                const language = (node as any)?.children?.[0]?.props?.className?.replace('language-', '') || 'text';
                
                const handleCopy = async () => {
                  try {
                    await navigator.clipboard.writeText(codeContent);
                    setIsCopied(true);
                    setTimeout(() => setIsCopied(false), 2000);
                  } catch (err) {
                    console.error('복사 실패:', err);
                  }
                };
                
                return (
                  <div className="code-block-wrapper">
                    <SyntaxHighlighter
                      language={language}
                      style={{}}
                      customStyle={{
                        backgroundColor: '#1a1a1a',
                        border: '1px solid #333',
                        borderRadius: '8px',
                        margin: 0,
                        fontSize: '14px',
                        lineHeight: '1.5',
                        fontFamily: 'SpaceMono-Regular, monospace',
                        color: '#e1e4e8'
                      }}
                    >
                      {codeContent}
                    </SyntaxHighlighter>
                    <button 
                      className={`code-copy-btn ${isCopied ? 'copied' : ''}`}
                      onClick={handleCopy}
                      title={isCopied ? 'Copied!' : 'Copy code'}
                    >
                      {isCopied ? <FaCheck /> : <FiCopy />}
                    </button>
                  </div>
                );
              };
              
              return <CodeBlockWithCopy />;
            },
            blockquote: ({node, ...props}) => <blockquote style={{margin: '1em 0', paddingLeft: '1em', fontStyle: 'italic'}} {...props} />,
            ul: ({node, ...props}) => <ul style={{margin: '0.8em 0', paddingLeft: '2em'}} {...props} />,
            ol: ({node, ...props}) => <ol style={{margin: '0.8em 0', paddingLeft: '2em'}} {...props} />,
            li: ({node, ...props}) => <li style={{margin: '0.3em 0'}} {...props} />,
            table: ({node, ...props}) => <table style={{borderCollapse: 'collapse', width: 'auto', margin: '1em 0', border: '1px solid #ddd', minWidth: 'fit-content'}} {...props} />,
            thead: ({node, ...props}) => <thead style={{backgroundColor: '#2a2a2a'}} {...props} />,
            tbody: ({node, ...props}) => <tbody {...props} />,
            tr: ({node, ...props}) => <tr style={{borderBottom: '1px solid #ddd'}} {...props} />,
            th: ({node, ...props}) => <th style={{border: '1px solid #ddd', padding: '8px 12px', textAlign: 'left', backgroundColor: '#2a2a2a', color: '#ffffff', fontWeight: 'bold', whiteSpace: 'nowrap'}} {...props} />,
            td: ({node, ...props}) => <td style={{border: '1px solid #ddd', padding: '8px 12px', textAlign: 'left', whiteSpace: 'nowrap'}} {...props} />,
          }}
        >
          {processedContent}
        </ReactMarkdown>
      )}
    </>
  );
};

// 언어 감지 함수
const detectLanguage = (text: string): string => {
  if (/[가-힣]/.test(text)) {
    return 'ko';
  } else if (/[あ-んア-ン]/.test(text)) {
    return 'ja';
  } else if (/[一-龯]/.test(text)) {
    return 'zh';
  } else {
    return 'en';
  }
};

// 다국어 로딩 메시지
const getLoadingMessage = (language: string): string => {
  switch (language) {
    case 'ko':
      return 'AI가 생각하고 있습니다...';
    case 'ja':
      return 'AIが考えています...';
    case 'zh':
      return 'AI正在思考中...';
    default:
      return 'AI is thinking...';
  }
};

// 시그니처 로딩 애니메이션 컴포넌트
const SignatureLoading: React.FC<{ language?: string }> = ({ language = 'ko' }) => {
  return (
    <div className="signature-loading">
      <div className="loading-circle"></div>
      <div className="loading-text">{getLoadingMessage(language)}</div>
    </div>
  );
};

  // 차트 옵션을 향상시키는 함수
  const enhanceChartOptions = (options: any): any => {
    const enhanced = { ...options };
    
    // ECharts 전역 폰트 설정 - 모든 텍스트에 Roboto 폰트 적용
    if (!enhanced.textStyle) {
      enhanced.textStyle = {};
    }
    enhanced.textStyle.fontFamily = 'Roboto, Roboto-Medium, sans-serif';
    
    // 범례 제거
    enhanced.legend = { show: false };
    
        // tooltip 활성화 (bar 호버 시 정보 표시)
    enhanced.tooltip = {
      show: true,
      trigger: 'axis',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      borderColor: '#00d4ff',
      borderWidth: 1,
      textStyle: {
        color: '#ffffff',
        fontSize: 12
      },
      formatter: function(params: any) {
        if (params && params.length > 0) {
          const data = params[0];
          return `
            <div style="padding: 8px;">
              <div style="font-weight: bold; margin-bottom: 4px;">${data.name}</div>
              <div style="color: #00d4ff;">${data.seriesName}: ${data.value}</div>
            </div>
          `;
        }
        return '';
      }
    };
  
  // 기본 grid 설정 (여백 확보) - x축 라벨이 잘리지 않도록 하단 여백 증가
  if (!enhanced.grid) {
    enhanced.grid = {
      left: '8%',
      right: '3%', // 오른쪽 여백을 더 줄여서 가로 공간 최대한 확대
      bottom: '15%', // x축 라벨이 눕혀져서 하단 여백 증가
      top: '20%', // 상단 여백을 늘려서 차트 제목과 아이콘이 겹치지 않도록
      containLabel: true
    };
  } else {
    // 기존 grid가 있는 경우에도 여백을 확보
    enhanced.grid = {
      ...enhanced.grid,
      left: enhanced.grid.left || '8%',
      right: enhanced.grid.right || '3%', // 오른쪽 여백을 더 줄여서 가로 공간 최대한 확대
      bottom: enhanced.grid.bottom || '15%', // x축 라벨이 눕혀져서 하단 여백 증가
      top: enhanced.grid.top || '12%', // 상단 여백을 더 줄여서 차트 영역 확대
      containLabel: true
    };
  }

  // 차트 제목 위치 조정 - 더 위쪽으로 이동
  if (enhanced.title) {
    enhanced.title = {
      ...enhanced.title,
      top: '8%', // 제목을 아래로 이동하여 아이콘과 겹치지 않도록
      left: 'center', // 제목을 중앙으로 이동
      textStyle: {
        ...enhanced.title.textStyle,
        fontSize: enhanced.title.textStyle?.fontSize || 'clamp(14px, 3.5vw, 22px)', // 반응형 글씨 크기
        color: enhanced.title.textStyle?.color || '#ffffff'
      }
    };
  }

  // 차트 타입별 최적화
  if (enhanced.series && Array.isArray(enhanced.series)) {
    // 지도 차트는 제외하고 처리
    const filteredSeries = enhanced.series.filter((series: any) => series.type !== 'map');
    if (filteredSeries.length === 0) {
      // 모든 시리즈가 지도 차트인 경우 에러
      throw new Error('지도 차트는 현재 지원되지 않습니다.');
    }
    
    filteredSeries.forEach((series: any) => {
      if (series.type === 'pie') {
        // 파이 차트 최적화
        series.center = series.center || ['50%', '55%'];
        series.radius = series.radius || '75%';
      } else if (series.type === 'bar') {
        // 바 차트 최적화 - 클릭 영역과 시각적 영역 일치하도록 조정
        series.barWidth = series.barWidth || '70%'; // 바 너비를 적절하게 조정
        series.barGap = series.barGap || '20%'; // 바 간격을 적절하게 조정
        series.barCategoryGap = series.barCategoryGap || '15%'; // 카테고리 간격을 적절하게 조정
        
        // bar chart 데이터를 value 값 순서대로 정렬 (큰 값이 위에 오도록)
        if (series.data && Array.isArray(series.data) && enhanced.xAxis && enhanced.xAxis.data) {
          // 데이터와 x축 라벨을 함께 정렬
          const combinedData = enhanced.xAxis.data.map((label: string, index: number) => ({
            label,
            value: series.data[index] || 0
          }));
          
          // value 값 기준으로 내림차순 정렬 (큰 값이 위에)
          combinedData.sort((a: { label: string; value: number }, b: { label: string; value: number }) => b.value - a.value);
          
          // 정렬된 데이터로 업데이트
          enhanced.xAxis.data = combinedData.map((item: { label: string; value: number }) => item.label);
          series.data = combinedData.map((item: { label: string; value: number }) => item.value);
        }
      } else if (series.type === 'line') {
        // 라인 차트 최적화
        series.smooth = series.smooth !== false; // 기본적으로 부드러운 라인
        series.lineStyle = {
          ...series.lineStyle,
          width: series.lineStyle?.width || 3
        };
      }
    });
    
    // 필터링된 시리즈로 교체
    enhanced.series = filteredSeries;
  }
  
  // x축 라벨 회전 및 간격 조정, 단위 표시
  if (enhanced.xAxis && Array.isArray(enhanced.xAxis)) {
    enhanced.xAxis.forEach((axis: any) => {
      if (axis.type === 'category') {
        axis.axisLabel = {
          ...axis.axisLabel,
          rotate: 0, // 회전 제거하여 가로로 표시
          interval: 0, // 모든 라벨 표시
          textStyle: {
            fontSize: 11,
            color: '#ccc'
          },
          margin: 20 // 라벨과 축 사이 여백 증가
        };
        // x축 이름과 단위 표시
        if (!axis.name) {
          axis.name = 'Category';
        }
        axis.nameLocation = 'middle';
        axis.nameGap = 50; // 이름과 라벨 사이 간격 증가
        axis.nameTextStyle = {
          color: '#ccc',
          fontSize: 12,
          fontWeight: 'bold'
        };
      }
    });
  } else if (enhanced.xAxis && enhanced.xAxis.type === 'category') {
    enhanced.xAxis.axisLabel = {
      ...enhanced.xAxis.axisLabel,
      rotate: 0, // 회전 제거하여 가로로 표시
      interval: 0, // 모든 라벨 표시
              textStyle: {
          fontSize: 11,
          color: '#ccc'
        },
      margin: 20 // 라벨과 축 사이 여백 증가
    };
    // x축 이름과 단위 표시
    if (!enhanced.xAxis.name) {
      enhanced.xAxis.name = 'Category';
    }
    enhanced.xAxis.nameLocation = 'middle';
    enhanced.xAxis.nameGap = 50; // 이름과 라벨 사이 간격 증가
            enhanced.xAxis.nameTextStyle = {
          color: '#ccc',
          fontSize: 12,
          fontWeight: 'bold',
          fontFamily: 'Roboto-Medium'
        };
  }
  
  // y축 스타일링 및 단위 표시
  if (enhanced.yAxis && Array.isArray(enhanced.yAxis)) {
    enhanced.yAxis.forEach((axis: any) => {
      axis.axisLine = { show: true, lineStyle: { color: '#333' } };
      axis.axisTick = { show: true, lineStyle: { color: '#333' } };
      axis.axisLabel = { color: '#ccc', fontSize: 10 };
      axis.splitLine = { lineStyle: { color: '#333', type: 'dashed' } };
      // y축 이름과 단위 표시
      if (!axis.name) {
        axis.name = 'Value';
      }
      axis.nameLocation = 'middle';
      axis.nameGap = 50;
      axis.nameTextStyle = {
        color: '#ccc',
        fontSize: 12,
        fontWeight: 'bold'
      };
    });
  } else if (enhanced.yAxis) {
    enhanced.yAxis.axisLine = { show: true, lineStyle: { color: '#333' } };
    enhanced.yAxis.axisTick = { show: true, lineStyle: { color: '#333' } };
    enhanced.yAxis.axisLabel = { color: '#ccc', fontSize: 10 };
    enhanced.yAxis.splitLine = { lineStyle: { color: '#333', type: 'dashed' } };
    // y축 이름과 단위 표시
    if (!enhanced.yAxis.name) {
      enhanced.yAxis.name = 'Value';
    }
    enhanced.yAxis.nameLocation = 'middle';
    enhanced.yAxis.nameGap = 50;
    enhanced.yAxis.nameTextStyle = {
      color: '#ccc',
      fontSize: 12,
      fontWeight: 'bold'
    };
  }
  
  // 시리즈 스타일링
  if (enhanced.series && Array.isArray(enhanced.series)) {
    enhanced.series.forEach((series: any) => {
      // 모든 차트 타입에 대해 테두리 제거
      if (!series.itemStyle) {
        series.itemStyle = {};
      }
      series.itemStyle.borderWidth = 0;
      series.itemStyle.borderColor = 'transparent';
      
      if (series.type === 'bar') {
        series.itemStyle = {
          ...series.itemStyle,
          borderRadius: [2, 2, 0, 0],
          color: series.color || new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#5470c6' },
            { offset: 1, color: '#91cc75' }
          ])
        };
        // bar 차트 interactive 설정
        series.animation = true;
        series.animationDuration = 300;
        series.animationEasing = 'cubicOut';
        // bar 차트에서 호버 시 세로 점선 표시를 위한 설정
        series.emphasis = {
          ...series.emphasis,
          focus: 'series',
          itemStyle: {
            ...series.emphasis?.itemStyle,
            borderWidth: 0, // 호버 시에도 테두리 없음
            borderColor: 'transparent',
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
            shadowOffsetX: 0,
            shadowOffsetY: 5
          }
        };
      }
    });
  }
  
  // 애니메이션 설정
  enhanced.animation = true;
  enhanced.animationDuration = 1000;
  enhanced.animationEasing = 'cubicOut';
  
  // bar 차트 전용 axisPointer 설정 (호버 시 해당 bar에 세로 점선만 표시)
  enhanced.axisPointer = {
    type: 'line', // 세로 점선 표시
    lineStyle: {
      color: '#999',
      width: 1,
      type: 'dashed'
    },
    show: true,
    triggerTooltip: false // 툴팁 트리거 비활성화
  };
  
  return enhanced;
};

// 차트 렌더링 컴포넌트
const ChartRenderer: React.FC<{ content: string; currentSession: ChatSession | null; files?: Array<{ name: string; size: number; type: string; content?: string; sheetNames?: string[] }> }> = ({ content, currentSession, files }) => {
  const [chartData, setChartData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // 채팅창에서 시트 선택 처리
  const handleSheetSelectionFromChat = async (file: any, sheetName: string) => {
    try {
      console.log('시트 선택 시 전달된 file 객체:', file);
      console.log('file 객체 타입:', typeof file);
      console.log('file 객체 키들:', Object.keys(file));
      
      // file 객체가 실제 File 객체가 아닌 경우를 처리
      if (!file.arrayBuffer) {
        console.log('file.arrayBuffer가 없습니다. 파일 정보만 표시합니다.');
        alert(`"${sheetName}" 시트가 선택되었습니다. 이제 해당 시트에 대해 분석을 요청해주세요.`);
        return;
      }
      
      // 선택된 시트의 내용을 읽어서 AI 분석 요청
      const content = await extractExcelSheetAsCsv(file, sheetName);
      
      // 새로운 메시지로 시트 선택 요청 전송
      const sheetSelectionMessage = `파일 "${file.name}"의 "${sheetName}" 시트를 분석해주세요.`;
      
      console.log(`시트 "${sheetName}" 선택됨:`, file.name);
      console.log('선택된 시트 내용:', content.substring(0, 200) + '...');
      
      // 사용자에게 안내
      alert(`"${sheetName}" 시트가 선택되었습니다. 이제 해당 시트에 대해 분석을 요청해주세요.`);
    } catch (error) {
      console.error('시트 처리 오류:', error);
      alert(`시트 "${sheetName}" 처리 중 오류가 발생했습니다: ${(error as Error).message}`);
    }
  };

  useEffect(() => {
    try {
      // AI 응답에서 차트 데이터 JSON 추출 시도
      const chartMatch = content.match(/```json\s*(\{[\s\S]*?\})\s*```/);
      if (chartMatch) {
        const jsonData = JSON.parse(chartMatch[1]);
        
        // 1. 특정 형식 (type: 'chart' + options)
        if (jsonData.type === 'chart' && jsonData.options) {
          const enhancedOptions = enhanceChartOptions(jsonData.options);
          setChartData(enhancedOptions);
          setError(null);
          return;
        }
        
        // 2. ECharts 표준 형식 (직접 사용 가능)
        if (jsonData.xAxis || jsonData.yAxis || jsonData.series) {
          const enhancedOptions = enhanceChartOptions(jsonData);
          setChartData(enhancedOptions);
          setError(null);
          return;
        }
      }

      // 다른 형태의 차트 데이터 패턴 시도
      const chartPatterns = [
        /```chart\s*(\{[\s\S]*?\})\s*```/,
        /```echarts\s*(\{[\s\S]*?\})\s*```/,
        /```data\s*(\{[\s\S]*?\})\s*```/
      ];

      for (const pattern of chartPatterns) {
        const match = content.match(pattern);
        if (match) {
          try {
            const jsonData = JSON.parse(match[1]);
            if (jsonData.options || jsonData.series || jsonData.xAxis) {
              const enhancedOptions = enhanceChartOptions(jsonData);
              setChartData(enhancedOptions);
              setError(null);
              return;
            }
          } catch (e) {
            continue;
          }
        }
      }

      setError('차트 데이터를 찾을 수 없습니다.');
    } catch (err) {
      if (err instanceof Error && err.message.includes('지도 차트')) {
        setError('지도 차트는 현재 지원되지 않습니다. 다른 차트 타입을 사용해주세요.');
      } else {
        setError('차트 데이터 파싱 중 오류가 발생했습니다.');
      }
      console.error('차트 파싱 오류:', err);
    }
  }, [content]);



  // 차트 다운로드 함수
  const handleChartDownload = () => {
    if (!chartData) return;
    
    try {
      // 차트 컨테이너를 찾아서 캔버스로 변환
      const chartContainer = document.querySelector('.chart-wrapper canvas');
      if (chartContainer) {
        // 캔버스를 이미지로 변환
        const canvas = chartContainer as HTMLCanvasElement;
        const image = canvas.toDataURL('image/png');
        
        // 다운로드 링크 생성
        const link = document.createElement('a');
        link.download = `chart_${Date.now()}.png`;
        link.href = image;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('차트 다운로드 실패:', error);
      alert('차트 다운로드에 실패했습니다.');
    }
  };

  if (error) {
    return null; // 에러 시 차트를 표시하지 않음
  }

  if (!chartData) {
    return null; // 차트 데이터가 없으면 표시하지 않음
  }

  // 지도 차트인 경우 GeoJSON 데이터가 필요하므로 에러 처리
  if (chartData.series && Array.isArray(chartData.series)) {
    const hasMapSeries = chartData.series.some((series: any) => series.type === 'map');
    if (hasMapSeries) {
      return (
        <div className="chart-container">
          <div className="chart-error">
            <p>지도 차트는 현재 지원되지 않습니다.</p>
            <p>다른 차트 타입(막대, 선, 파이 등)을 사용해주세요.</p>
          </div>
        </div>
      );
    }
  }

  return (
    <>
      {/* 시트 선택이 필요한 경우 시트 선택 컴포넌트 표시 (AI 답변 내부에만) */}
      {files && files.some(file => file.sheetNames && file.sheetNames.length > 1) && (
        <div className="sheet-selection-inline">
          <div className="sheet-selection-header">
            <h4>📊 Excel 파일 시트 선택</h4>
            <p>분석할 시트를 선택해주세요:</p>
          </div>
          <div className="sheet-selection-buttons">
            {files.map((file, fileIndex) => 
              file.sheetNames && file.sheetNames.length > 1 ? (
                <div key={fileIndex} className="file-sheet-selection">
                  <div className="file-name">{file.name}</div>
                  <div className="sheet-buttons">
                    {file.sheetNames.map((sheetName, sheetIndex) => (
                      <button
                        key={sheetIndex}
                        className="sheet-selection-btn"
                        onClick={() => handleSheetSelectionFromChat(file, sheetName)}
                      >
                        <span className="sheet-icon">📊</span>
                        <span className="sheet-name">{sheetName}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null
            )}
          </div>
        </div>
      )}

      {/* 차트가 있는 경우에만 차트 표시 */}
      {chartData && (
        <div className="chart-container">
          {/* 차트 상단 오른쪽에 아이콘 배치 */}
          <div className="chart-actions">
            <FiDownload 
              className="chart-action-icon" 
              onClick={handleChartDownload}
              style={{ cursor: 'pointer' }}
              title="Download as PNG"
            />
            <FiMaximize2 className="chart-action-icon" />
          </div>
          
          <ReactECharts 
            option={chartData}
            style={{ 
              height: 'clamp(300px, 50vh, 450px)',
              width: '100%', 
              maxWidth: '100%',
              minWidth: '200px'
            }}
            opts={{ 
              renderer: 'canvas',
              width: 'auto',
              height: 'auto'
            }}
            notMerge={true}
            lazyUpdate={true}
            onChartReady={(chart) => {
              // 차트 크기 자동 조정
              chart.resize({
                width: 'auto',
                height: 'auto'
              });
              
              // 차트 이벤트 리스너 추가
              chart.on('click', (params: any) => {
                console.log('차트 클릭:', params);
              });
              
              chart.on('legendselectchanged', (params: any) => {
                console.log('범례 선택 변경:', params);
              });
            }}
            onEvents={{
              click: (params: any) => {
                console.log('차트 클릭 이벤트:', params);
              },
              legendselectchanged: (params: any) => {
                console.log('범례 선택 변경:', params);
              }
            }}
          />
        </div>
      )}
    </>
  );
};

const Dashboard: React.FC = () => {
  const { currentUser, userData, logout, updateProfileImage } = useAuth();
  const navigate = useNavigate();
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [prompt, setPrompt] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [isChatMode, setIsChatMode] = useState(false);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [isNewChatSelected, setIsNewChatSelected] = useState(false);
  const [isChatSearchSelected, setIsChatSearchSelected] = useState(false);
  const [isFilesSelected, setIsFilesSelected] = useState(false);
  const [isSettingsSelected, setIsSettingsSelected] = useState(false);
  const [isChatSearchModalOpen, setIsChatSearchModalOpen] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [selectedSessionForRename, setSelectedSessionForRename] = useState<ChatSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState('default');
  const [cachedProfileImageURL, setCachedProfileImageURL] = useState<string | null>(null);
  
  // 프로필 드롭다운 외부 클릭 감지를 위한 ref
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  

  
  // 자동 스크롤을 위한 ref
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // 프로필 이미지 캐싱
  useEffect(() => {
    if (userData?.profileImageURL) {
      getCachedProfileImageUrl(userData.profileImageURL).then(cachedURL => {
        setCachedProfileImageURL(cachedURL);
        console.log('Dashboard: 프로필 이미지 캐시 완료:', cachedURL);
      }).catch(error => {
        console.error('Dashboard: 프로필 이미지 캐싱 실패:', error);
        setCachedProfileImageURL(userData.profileImageURL || null);
      });
    } else {
      setCachedProfileImageURL(null);
    }
  }, [userData?.profileImageURL]);
  
  // 드롭다운 밖 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // 채팅 아이템 드롭다운 외부 클릭 감지
      if (openDropdownId && !(event.target as Element).closest('.chat-item-container')) {
        setOpenDropdownId(null);
      }
      
      // 프로필 드롭다운 외부 클릭 감지
      if (profileDropdownOpen && profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdownId, profileDropdownOpen]);

  // 자동 스크롤 함수
  const scrollToBottom = () => {
    if (chatMessagesEndRef.current) {
      chatMessagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    // 추가로 chatContainerRef도 사용하여 더 확실하게 스크롤
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  // 메시지가 추가되거나 로딩 상태가 변경될 때 자동 스크롤
  useEffect(() => {
    // 메시지 개수나 로딩 상태가 변경되었을 때만 스크롤
    if (currentSession?.messages && !isLoading) {
      scrollToBottom();
    }
  }, [currentSession?.messages.length, isLoading]);

  // currentSession이 변경될 때 자동 스크롤 (채팅 히스토리 클릭 시)
  useEffect(() => {
    if (currentSession && currentSession.messages.length > 0) {
      // 약간의 지연을 두어 DOM이 완전히 렌더링된 후 스크롤
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [currentSession?.id]);

  // 사용자 이니셜 생성 함수 (개선된 버전)
  const getUserInitials = (name: string) => {
    if (!name || name.trim() === '') return 'U';
    
    // 이름을 공백으로 분리하고 각 단어의 첫 글자만 추출
    const words = name.trim().split(' ').filter(word => word.length > 0);
    
    if (words.length === 0) return 'U';
    if (words.length === 1) return words[0].charAt(0).toUpperCase();
    
    // 첫 번째와 마지막 단어의 첫 글자 사용 (구글 스타일)
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  };

  // 프로필 이니셜 배경색 생성 (이름 기반 랜덤)
  const getProfileAvatarColor = (name: string) => {
    if (!name) return '#666';
    
    // 이름의 각 문자를 숫자로 변환하여 색상 생성
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // 구글 스타일 색상 팔레트
    const colors = [
      '#4285f4', // Google Blue
      '#ea4335', // Google Red
      '#fbbc04', // Google Yellow
      '#34a853', // Google Green
      '#ff6d01', // Orange
      '#9c27b0', // Purple
      '#00bcd4', // Cyan
      '#e91e63', // Pink
      '#795548', // Brown
      '#607d8b'  // Blue Grey
    ];
    
    return colors[Math.abs(hash) % colors.length];
  };

  // 사용자 데이터가 로드되었는지 확인하는 함수
  const isUserDataLoaded = () => {
    return userData && userData.displayName && userData.displayName.trim() !== '';
  };

  // 프로필 이니셜을 가져오는 함수
  const getProfileInitials = () => {
    if (isUserDataLoaded()) {
      return getUserInitials(userData!.displayName);
    } else if (currentUser?.displayName) {
      return getUserInitials(currentUser.displayName);
    }
    return 'U';
  };

  // 프로필 배경색을 가져오는 함수
  const getProfileBackgroundColor = () => {
    if (isUserDataLoaded()) {
      return getProfileAvatarColor(userData!.displayName);
    } else if (currentUser?.displayName) {
      return getProfileAvatarColor(currentUser.displayName);
    }
    return '#666';
  };

  const suggestedTags = [
    'Data Analysis',
    'Chart Creation',
    'Insight Extraction',
    'Data Cleaning',
    'AI Modeling',
    'Visualization',
    'Statistical Analysis',
    'Prediction Model'
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => validateFile(file));
    
    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles]);
      console.log('파일 추가됨:', validFiles.map(f => f.name));
      console.log('Selected files state updated:', [...selectedFiles, ...validFiles]);
    }
    
    if (files.length !== validFiles.length) {
      alert('일부 파일이 지원되지 않는 형식입니다. CSV, DOC, PDF 파일만 업로드 가능합니다.');
    }
    
    // input 초기화
    e.target.value = '';
  };

  const handleRemoveFile = (messageId: string, fileIndex: number) => {
    if (currentSession) {
      const updatedMessages = currentSession.messages.map(message => {
        if (message.id === messageId && message.files) {
          const updatedFiles = message.files.filter((_, index) => index !== fileIndex);
          return {
            ...message,
            files: updatedFiles.length > 0 ? updatedFiles : undefined
          };
        }
        return message;
      });
      
      const updatedSession = {
        ...currentSession,
        messages: updatedMessages
      };
      
      setCurrentSession(updatedSession);
      
      // Firebase에 업데이트된 세션 저장
      if (currentUser) {
        updateChatSession(updatedSession.id, updatedSession);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && currentUser) {
      setIsLoading(true);
      
      try {
        // 채팅 모드로 전환
        if (!isChatMode) {
          setIsChatMode(true);
        }

        // 파일 내용 읽기 및 Firebase Storage에 업로드
        let fileContent = '';
        const processedFiles = [];
        
        if (selectedFiles.length > 0 && currentUser) {
          for (const file of selectedFiles) {
            try {
              // Firebase Storage에 파일 업로드
              await uploadFileToStorage(file, currentUser.uid);
              
              // Excel 파일인지 확인하고 시트 정보 수집
              if (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')) {
                try {
                  const sheetNames = await getExcelSheetNames(file);
                  if (sheetNames.length > 1) {
                    // 여러 시트가 있는 Excel 파일인 경우 - 시트 이름들을 모두 전달
                    fileContent += `파일: ${file.name}\n이 파일에는 ${sheetNames.length}개의 시트가 있습니다:\n${sheetNames.map((name, index) => `${index + 1}. ${name}`).join('\n')}\n\n`;
                    
                    processedFiles.push({
                      name: file.name,
                      size: file.size,
                      type: file.type,
                      content: `다중 시트 Excel 파일 (${sheetNames.length}개 시트): ${sheetNames.join(', ')}`,
                      sheetNames: sheetNames // 시트 이름 정보 추가
                    });
                  } else {
                    // 단일 시트 Excel 파일인 경우
                    const content = await readFileContent(file);
                    fileContent += `파일: ${file.name}\n${content}\n\n`;
                    
                    processedFiles.push({
                      name: file.name,
                      size: file.size,
                      type: file.type,
                      content: content
                    });
                  }
                } catch (error) {
                  console.error('Excel 파일 시트 정보 읽기 실패:', error);
                  const content = await readFileContent(file);
                  fileContent += `파일: ${file.name}\n${content}\n\n`;
                  
                  processedFiles.push({
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    content: content
                  });
                }
              } else {
                // Excel이 아닌 다른 파일 형식
                const content = await readFileContent(file);
                fileContent += `파일: ${file.name}\n${content}\n\n`;
                
                processedFiles.push({
                  name: file.name,
                  size: file.size,
                  type: file.type,
                  content: content
                });
              }
            } catch (error) {
              console.error('파일 처리 오류:', error);
              fileContent += `파일: ${file.name} (처리 실패)\n\n`;
              
              processedFiles.push({
                name: file.name,
                size: file.size,
                type: file.type,
                    content: `처리 실패`
              });
            }
          }
        }

        // 사용자 메시지 생성
        const userMessage: ChatMessage = {
          id: Date.now().toString(),
          role: 'user',
          content: prompt,
          timestamp: new Date(),
          files: processedFiles.length > 0 ? processedFiles : undefined
        };

        // 파일 내용 읽기
        if (processedFiles.length > 0) {
          try {
            const file = processedFiles[0];
            if (file.content) {
              fileContent = file.content;
              console.log('File content loaded, length:', fileContent.length);
            } else {
              console.warn('File content is empty');
            }
          } catch (error) {
            console.error('Error reading file content:', error);
          }
        }

        // 디버깅을 위한 로그
        console.log('Selected files:', selectedFiles);
        console.log('User message with file:', userMessage);
        console.log('File content available:', !!fileContent);

        let newSession: ChatSession | null = null;
        
        if (currentSessionId === '') {
          // 새로운 채팅 세션 생성
          newSession = {
            id: Date.now().toString(),
            userId: currentUser.uid,
            title: generateChatTitle(prompt),
            messages: [userMessage],
            createdAt: new Date(),
            lastMessageAt: new Date(),
            fileAttached: selectedFiles.length > 0
          };
          
          setChatSessions(prev => [newSession!, ...prev]);
          setCurrentSessionId(newSession.id);
          setCurrentSession(newSession);
          setIsNewChatSelected(false); // New Chat 선택 해제
          setIsChatMode(true); // 채팅 모드 활성화
          
          // Firestore에 저장
          await saveChatSession(newSession);
        } else {
          // 기존 세션에 사용자 메시지 추가
          const updatedSession = {
            ...currentSession!,
            messages: [...currentSession!.messages, userMessage],
            lastMessageAt: new Date()
          };
          
          setChatSessions(prev => 
            prev.map(session => 
              session.id === currentSessionId ? updatedSession : session
            )
          );
          setCurrentSession(updatedSession);
          
          // Firestore 업데이트
          await updateChatSession(currentSessionId, {
            messages: updatedSession.messages,
            lastMessageAt: updatedSession.lastMessageAt
          });
        }

        // ChatGPT API 호출
        const apiMessages: APIChatMessage[] = currentSessionId === '' 
          ? [{ role: 'user', content: prompt }]
          : [
              ...currentSession!.messages.map(msg => ({
                role: msg.role as 'user' | 'assistant',
                content: msg.content
              })),
              { role: 'user', content: prompt }
            ];

        const aiResponse = await sendMessageToChatGPT(apiMessages, fileContent);
        
        // AI 응답 메시지 생성 (타이핑 효과를 위해 isTyping 플래그 추가)
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: aiResponse,
          timestamp: new Date(),
          isTyping: true // 타이핑 효과 시작
        };

        // AI 응답을 현재 세션에 추가 (타이핑 중 상태로)
        if (currentSessionId === '' && !newSession) {
          throw new Error('새로운 세션을 생성할 수 없습니다.');
        }
        
        const finalSession = currentSessionId === '' 
          ? { ...newSession!, messages: [userMessage, aiMessage] }
          : { ...currentSession!, messages: [...currentSession!.messages, userMessage, aiMessage] };

        setCurrentSession(finalSession);
        
        // Firestore 업데이트
        if (currentSessionId === '') {
          // 새로운 세션이므로 업데이트가 아닌 저장
          await saveChatSession(finalSession);
        } else {
          await updateChatSession(currentSessionId, {
            messages: finalSession.messages,
            lastMessageAt: finalSession.lastMessageAt
          });
        }

        setPrompt('');
        setSelectedFiles([]);
        
        // 타이핑 효과 완료 후 isTyping 플래그 제거
        setTimeout(() => {
          setCurrentSession(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              messages: prev.messages.map(msg => 
                msg.id === aiMessage.id ? { ...msg, isTyping: false } : msg
              )
            };
          });
        }, 100);
      } catch (error) {
        console.error('메시지 전송 오류:', error);
        if (error instanceof Error) {
          alert(`메시지 전송에 실패했습니다: ${error.message}`);
        } else {
          alert('메시지 전송에 실패했습니다. 다시 시도해주세요.');
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const toggleProfileDropdown = () => {
    setProfileDropdownOpen(!profileDropdownOpen);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/'); // 로그아웃 후 홈페이지로 이동
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };

  const toggleChatDropdown = (sessionId: string) => {
    setOpenDropdownId(openDropdownId === sessionId ? null : sessionId);
  };

  // 채팅 세션 삭제 함수 (soft delete)
  const handleDeleteChat = async (sessionId: string) => {
    if (!confirm('이 채팅을 삭제하시겠습니까?')) return;
    
    try {
      // Firestore에서 status를 'deleted'로 변경
      await updateChatSessionStatus(sessionId, 'deleted');
      
      // 로컬 상태에서도 제거
      setChatSessions(prev => prev.filter(session => session.id !== sessionId));
      
      // 현재 선택된 세션이 삭제된 세션이라면 New Chat으로 이동
      if (currentSessionId === sessionId) {
        setCurrentSessionId('');
        setCurrentSession(null);
        setIsNewChatSelected(true);
        setIsChatMode(false);
        setIsChatSearchSelected(false);
        setIsFilesSelected(false);
      }
      
      // 드롭다운 닫기
      setOpenDropdownId(null);
      
      console.log('채팅 세션이 삭제되었습니다:', sessionId);
    } catch (error) {
      console.error('채팅 세션 삭제 오류:', error);
      alert('채팅 삭제에 실패했습니다. 다시 시도해주세요.');
    }
  };

  // 채팅 이름 변경 함수
  const handleRenameChat = async (newTitle: string) => {
    if (!selectedSessionForRename) return;
    
    try {
      // Firestore에서 채팅 세션 제목 업데이트
      await updateChatSession(selectedSessionForRename.id, {
        title: newTitle
      });
      
      // 로컬 상태 업데이트
      setChatSessions(prev => prev.map(session => 
        session.id === selectedSessionForRename.id 
          ? { ...session, title: newTitle }
          : session
      ));
      
      // 현재 세션이 변경된 세션인 경우 currentSession도 업데이트
      if (currentSessionId === selectedSessionForRename.id) {
        setCurrentSession(prev => prev ? { ...prev, title: newTitle } : prev);
      }
      
      console.log('채팅 이름이 변경되었습니다:', newTitle);
    } catch (error) {
      console.error('채팅 이름 변경 오류:', error);
      throw error;
    }
  };

  // Rename 모달 열기
  const openRenameModal = (session: ChatSession) => {
    setSelectedSessionForRename(session);
    setIsRenameModalOpen(true);
    setOpenDropdownId(null); // 드롭다운 닫기
  };

  // Rename 모달 닫기
  const closeRenameModal = () => {
    setIsRenameModalOpen(false);
    setSelectedSessionForRename(null);
  };

  const startNewChat = () => {
    setIsChatMode(false);
    setCurrentSessionId('');
    setCurrentSession(null);
    setPrompt('');
    setSelectedFiles([]);
    setIsNewChatSelected(true); // New Chat 버튼의 선택 상태를 관리
    setIsChatSearchSelected(false); // Chat Search 선택 해제
    setIsFilesSelected(false); // Files 선택 해제
    setIsSettingsSelected(false); // Settings 선택 해제
  };

  const handleChatSearchClick = () => {
    setIsChatSearchSelected(true);
    setIsNewChatSelected(false);
    setIsFilesSelected(false);
    setIsSettingsSelected(false);
    setIsChatSearchModalOpen(true);
  };

  const handleChatSearchModalClose = () => {
    setIsChatSearchModalOpen(false);
    setIsChatSearchSelected(false); // Chat Search 선택 해제
  };

  const handleChatSearchSelect = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    const selectedSession = chatSessions.find(session => session.id === sessionId);
    if (selectedSession) {
      setCurrentSession(selectedSession);
      setIsChatMode(true);
      setIsNewChatSelected(false);
      setIsChatSearchSelected(false);
      setIsFilesSelected(false);
      setIsSettingsSelected(false);
      
      // Chat Search에서 선택한 후 자동 스크롤을 위해 약간의 지연
      setTimeout(() => {
        scrollToBottom();
      }, 200);
    }
  };

  const handleFilesClick = () => {
    console.log('Files 버튼 클릭됨');
    // 모든 상태를 초기화하고 Files 모드로 설정
    setIsFilesSelected(true);
    setIsNewChatSelected(false);
    setIsChatSearchSelected(false);
    setIsSettingsSelected(false);
    setIsChatMode(false);
    setCurrentSessionId('');
    setCurrentSession(null);
    setPrompt(''); // 프롬프트도 초기화
    setSelectedFiles([]); // 선택된 파일도 초기화
    console.log('isFilesSelected:', true);
    console.log('isChatMode:', false);
    console.log('isNewChatSelected:', false);
  };

  const handleSettingsClick = () => {
    console.log('Settings 버튼 클릭됨');
    // 모든 상태를 초기화하고 Settings 모드로 설정
    setIsSettingsSelected(true);
    setIsNewChatSelected(false);
    setIsChatSearchSelected(false);
    setIsFilesSelected(false);
    setIsChatMode(false);
    setCurrentSessionId('');
    setCurrentSession(null);
    setPrompt('');
    setSelectedFiles([]);
    console.log('isSettingsSelected:', true);
    console.log('isChatMode:', false);
    console.log('isNewChatSelected:', false);
  };

  const copyToClipboard = async (messageId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      
      // 해당 메시지의 복사 상태를 true로 설정
      setChatSessions(prev => prev.map(session => ({
        ...session,
        messages: session.messages.map(msg => 
          msg.id === messageId 
            ? { ...msg, isCopied: true }
            : msg
        )
      })));
      
      // currentSession도 함께 업데이트
      setCurrentSession(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: prev.messages.map(msg => 
            msg.id === messageId 
              ? { ...msg, isCopied: true }
              : msg
          )
        };
      });
      
      // 2초 후 복사 상태 해제
      setTimeout(() => {
        setChatSessions(prev => prev.map(session => ({
          ...session,
          messages: session.messages.map(msg => 
            msg.id === messageId 
              ? { ...msg, isCopied: false }
              : msg
          )
        })));
        
        // currentSession도 함께 업데이트
        setCurrentSession(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            messages: prev.messages.map(msg => 
              msg.id === messageId 
                ? { ...msg, isCopied: false }
                : msg
            )
          };
        });
      }, 2000);
    } catch (err) {
      console.error('복사 실패:', err);
    }
  };

  // textarea 높이 자동 조정 함수
  const adjustTextareaHeight = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  // 채팅 제목 생성 함수
  const generateChatTitle = (userMessage: string): string => {
    // 첫 번째 사용자 메시지의 첫 50자로 제목 생성
    const title = userMessage.trim().slice(0, 50);
    return title.length === 50 ? title + '...' : title;
  };

  // 제목 자르기 함수
  const truncateTitle = (title: string, maxLength?: number): string => {
    const limit = maxLength || (detectLanguage(title) === 'ko' ? 20 : 30);
    if (title.length <= limit) return title;
    return title.slice(0, limit) + '...';
  };





  // 컴포넌트 마운트 시 사용자의 채팅 세션 불러오기
  useEffect(() => {
    const loadUserChatSessions = async () => {
      if (currentUser) {
        try {
          console.log('채팅 세션 로딩 시작...');
          console.log('현재 사용자 ID:', currentUser.uid);
          
          // 기존 채팅 세션들을 마이그레이션 (status 필드 추가)
          console.log('기존 채팅 세션 마이그레이션 시작...');
          await migrateExistingChatSessions(currentUser.uid);
          console.log('마이그레이션 완료');
          
          console.log('채팅 세션 가져오기 시작...');
          const sessions = await getUserChatSessions(currentUser.uid);
          console.log('가져온 채팅 세션 수:', sessions.length);
          console.log('가져온 세션들:', sessions);
          
          setChatSessions(sessions);
          
          // Files 모드나 Settings 모드가 활성화되어 있지 않을 때만 상태 변경
          if (!isFilesSelected && !isSettingsSelected) {
            // 채팅 세션이 없거나 현재 세션이 없어도 New Chat을 자동 선택하지 않음
            if (sessions.length === 0 || !currentSessionId) {
              console.log('채팅 세션이 없지만 New Chat 자동 선택하지 않음');
              setIsChatMode(false);
              setIsChatSearchSelected(false);
            } else {
              console.log('채팅 세션이 있어서 New Chat 선택 해제');
              // 현재 세션이 있으면 New Chat 선택 해제
              setIsNewChatSelected(false);
              setIsChatSearchSelected(false);
            }
          }
        } catch (error) {
          console.error('채팅 세션 불러오기 오류:', error);
          // 에러가 발생해도 앱이 계속 작동하도록 처리
          setChatSessions([]);
          setIsChatMode(false);
        }
      }
    };

    loadUserChatSessions();
    
    // 디버깅: 환경 변수 확인
    console.log('Dashboard 환경 변수 확인:', {
      VITE_OPENAI_API_KEY: import.meta.env.VITE_OPENAI_API_KEY ? '설정됨' : '설정되지 않음',
      VITE_FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY ? '설정됨' : '설정되지 않음'
    });
  }, [currentUser, currentSessionId]);

  return (
    <div className="dashboard">
      {/* 사이드바 */}
      <div className={`sidebar ${sidebarExpanded ? 'expanded' : 'collapsed'}`}>
        <div className="sidebar-header">
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarExpanded(!sidebarExpanded)}
          >
            <FiSidebar />
          </button>
        </div>

        <div className="sidebar-content">
          {/* 메인 메뉴 */}
          <div className="sidebar-section">
            <button 
              className={`sidebar-btn primary ${isNewChatSelected ? 'active' : ''}`}
              onClick={startNewChat}
            >
              <FaMagic className="btn-icon" />
              {sidebarExpanded && <span>New Chat</span>}
            </button>
            <button 
              className={`sidebar-btn ${isChatSearchSelected ? 'active' : ''}`}
              onClick={handleChatSearchClick}
            >
              <FaSearch className="btn-icon" />
              {sidebarExpanded && <span>Chat Search</span>}
            </button>
            <button 
              className={`sidebar-btn ${isFilesSelected ? 'active' : ''}`}
              onClick={handleFilesClick}
            >
              <FaFile className="btn-icon" />
              {sidebarExpanded && <span>Files</span>}
            </button>
          </div>

          {/* 채팅 히스토리 */}
          {sidebarExpanded && (
            <div className="sidebar-section">
              <div className="chat-history">
                {chatSessions.map((session) => (
                  <div key={session.id} className="chat-item-container">
                    <button 
                      className={`chat-item ${session.id === currentSessionId ? 'active' : ''}`}
                      onClick={() => {
                        setCurrentSessionId(session.id);
                        setCurrentSession(session);
                        setIsChatMode(true);
                        setIsNewChatSelected(false); // New Chat 선택 해제
                        setIsChatSearchSelected(false); // Chat Search 선택 해제
                        setIsFilesSelected(false); // Files 선택 해제
                        setIsSettingsSelected(false); // Settings 선택 해제
                      }}
                    >
                      <div className="chat-item-content">
                        <span className="chat-title" title={session.title}>
                          {detectLanguage(session.title) === 'ko' 
                            ? (session.title.length > 20 ? `${session.title.slice(0, 20)}...` : session.title)
                            : (session.title.length > 30 ? `${session.title.slice(0, 30)}...` : session.title)
                          }
                        </span>
                        <span className="chat-timestamp">
                          {session.lastMessageAt.toLocaleDateString()}
                        </span>
                      </div>
                    </button>
                    <button 
                      className="chat-item-menu-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleChatDropdown(session.id);
                      }}
                    >
                      <FaEllipsisV className="chat-item-menu" />
                    </button>
                    
                    {/* 드롭다운 메뉴 */}
                    {openDropdownId === session.id && (
                      <div className="chat-dropdown">
                        <div className="dropdown-item">
                          <FiStar className="dropdown-icon" />
                          <span>Star</span>
                        </div>
                        <div className="dropdown-item" onClick={() => openRenameModal(session)}>
                          <FiEdit3 className="dropdown-icon" />
                          <span>Rename</span>
                        </div>
                        <div className="dropdown-separator"></div>
                        <div className="dropdown-item delete" onClick={() => handleDeleteChat(session.id)}>
                          <FaTrash className="dropdown-icon" />
                          <span>Delete</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* 프로필 섹션 */}
        <div className="sidebar-profile" ref={profileDropdownRef}>
          <div className="profile-info" onClick={toggleProfileDropdown}>
            {cachedProfileImageURL ? (
              <div className="profile-image-container">
                <img 
                  src={cachedProfileImageURL} 
                  alt="Profile" 
                  className="sidebar-profile-image"
                />
              </div>
            ) : (
              <div className="profile-initials" style={{ backgroundColor: getProfileBackgroundColor() }}>
                <span className="user-initials">
                  {getProfileInitials()}
                </span>
              </div>
            )}
            {sidebarExpanded && (
              <div className="profile-details">
                <span className="profile-name">
                  {isUserDataLoaded() ? userData!.displayName : (currentUser?.displayName || 'User')}
                </span>
                <span className="profile-plan">Free Plan</span>
              </div>
            )}
            {sidebarExpanded && (
              <div className={`profile-caret ${profileDropdownOpen ? 'open' : ''}`}>
                <FaCaretUp />
              </div>
            )}
          </div>
          
          {/* 드롭다운 메뉴 */}
          {profileDropdownOpen && sidebarExpanded && (
            <div className="profile-dropdown">
              <div className="dropdown-item" onClick={handleSettingsClick}>
                <FiSettings className="dropdown-icon" />
                <span>Plans and Billing</span>
              </div>
              <div className="dropdown-item">
                <FiRefreshCw className="dropdown-icon" />
                <span>Switch Workspace</span>
              </div>
              <div className="dropdown-item" onClick={handleLogout}>
                <FiLogOut className="dropdown-icon" />
                <span>Log out</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 메인 컨테이너 */}
      <div className="main-container">
        {/* 렌더링 상태 디버깅 */}
        {isSettingsSelected ? (
          // Settings 페이지
          <Settings 
            key={`settings-${userData?.profileImageURL || 'default'}`} // key를 추가하여 profileImageURL 변경 시 컴포넌트 재렌더링
            onBack={() => setIsSettingsSelected(false)}
            profileInitials={getProfileInitials()}
            profileBackgroundColor={getProfileBackgroundColor()}
            displayName={isUserDataLoaded() ? userData!.displayName : (currentUser?.displayName || 'User')}
            userId={currentUser?.uid || ''}
            initialProfileImageURL={userData?.profileImageURL}
            onProfileImageUpdate={async (imageURL) => {
              try {
                console.log('Dashboard: 프로필 이미지 업데이트 시작:', imageURL);
                
                // 기존 프로필 이미지 캐시 제거
                if (userData?.profileImageURL) {
                  removeProfileImageFromCache(userData.profileImageURL);
                }
                
                // AuthContext를 통해 프로필 이미지 업데이트
                await updateProfileImage(imageURL);
                console.log('Dashboard: 프로필 이미지 업데이트 완료');
              } catch (error) {
                console.error('Dashboard: 프로필 이미지 업데이트 실패:', error);
                alert('프로필 이미지 업데이트에 실패했습니다.');
              }
            }}
          />
        ) : isFilesSelected ? (
          // Files 페이지
          <FilesPage />
        ) : !isChatMode ? (
          // 기본 대시보드 모드
          <div className="dashboard-content">
            <div className="welcome-section">
              <h1>How can I help you?</h1>
              <p>From data analysis to insight extraction, afterwon is here to help.</p>
            </div>

            {/* 프롬프트 입력창 */}
            <form className="prompt-form" onSubmit={handleSubmit}>
              <div className="prompt-input-container">
                <label htmlFor="file-upload" className="file-upload-btn">
                  <FaPlus />
                  <input
                    id="file-upload"
                    type="file"
                    accept=".csv,.doc,.docx,.pdf,.xlsx,.xls"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => {
                    setPrompt(e.target.value);
                    adjustTextareaHeight(e);
                  }}
                  placeholder="Upload and start analyzing data"
                  className="prompt-input"
                  rows={1}
                />
                <button type="submit" className="prompt-submit">
                  <FaArrowUp />
                </button>
              </div>
              {selectedFiles.length > 0 && (
                <div className="selected-files">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="selected-file">
                      <span className="file-name">{file.name}</span>
                      <button type="button" className="remove-file-btn" onClick={() => removeFile(index)}>
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </form>

            {/* 제안 태그들 */}
            <div className="suggested-tags">
              <div className="tags-grid">
                {suggestedTags.map((tag, index) => (
                  <button
                    key={index}
                    className="tag-btn"
                    onClick={() => setPrompt(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>



            {/* 면책 조항 */}
            <div className="disclaimer">
              <p>afterwon may make mistakes. Please verify important information.</p>
            </div>
          </div>
        ) : (
          // 채팅 모드
          <div className="workspace">
            <div className="chat-column">
              <div className="chat-messages" ref={chatContainerRef}>
                {currentSession?.messages.map((message) => (
                  <div key={message.id} className={`message ${message.role === 'user' ? 'user' : 'ai'}`}>
                    <div className="message-content">
                      {message.files && message.files.map((file, fileIndex) => (
                        <div key={fileIndex} className="message-file">
                          <div className="file-info">
                            {file.type === 'application/pdf' ? (
                              <FaFilePdf className="file-icon" />
                            ) : file.type === 'text/csv' ? (
                              <FaFileCsv className="file-icon" />
                            ) : file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ? (
                              <FaFileExcel className="file-icon" />
                            ) : file.type === 'application/msword' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ? (
                              <FaFileWord className="file-icon" />
                            ) : (
                              <FaFile className="file-icon" />
                            )}
                            <div className="file-details">
                              <span className="file-name">{file.name}</span>
                              <span className="file-type">
                                {file.type === 'application/pdf' ? 'PDF 문서' :
                                 file.type === 'text/csv' ? 'CSV 파일' :
                                 file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ? 'Excel 파일' :
                                 file.type === 'application/msword' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ? 'Word 문서' :
                                 '파일'}
                              </span>
                            </div>
                          </div>

                        </div>
                      ))}
                      {message.isTyping ? (
                        <TypingMessage content={message.content} onComplete={() => {}} onTypingUpdate={scrollToBottom} />
                      ) : (
                        <>
                          {/* AI 응답인 경우 차트를 먼저 표시 */}
                          {message.role === 'assistant' && (
                            <ChartRenderer content={message.content} currentSession={currentSession} files={message.files} />
                          )}
                          
                          {/* 그 다음 텍스트 답변 표시 */}
                          <AIMessageRenderer content={message.content} files={message.files} />
                        </>
                      )}
                    </div>
                    <div className="message-actions">
                      <button 
                        className={`copy-btn ${message.isCopied ? 'copied' : ''}`}
                        onClick={() => copyToClipboard(message.id, message.content)}
                        title={message.isCopied ? 'Copied!' : 'Copy message'}
                      >
                        {message.isCopied ? <FaCheck /> : <FiCopy />}
                      </button>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="message ai">
                    <div className="message-content">
                      <SignatureLoading language={detectLanguage(prompt)} />
                    </div>
                  </div>
                )}
                {/* 자동 스크롤을 위한 포인트 */}
                <div ref={chatMessagesEndRef} />
              </div>
              
              {/* 채팅 입력창 */}
              <div className="chat-input-container">
                <form className="chat-input-form" onSubmit={handleSubmit}>
                  {selectedFiles.length > 0 && (
                    <div className="selected-files-compact">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="selected-file-compact">
                          <FaFile className="file-icon-small" />
                          <span className="file-name-compact">{file.name}</span>
                          <button type="button" className="remove-file-btn-compact" onClick={() => removeFile(index)}>
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* 상단: 텍스트 입력 영역 */}
                  <div className="chat-input-main">
                    <textarea
                      value={prompt}
                      onChange={(e) => {
                        setPrompt(e.target.value);
                        adjustTextareaHeight(e);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.altKey && e.shiftKey) {
                          e.preventDefault();
                          const textarea = e.target as HTMLTextAreaElement;
                          const start = textarea.selectionStart;
                          const end = textarea.selectionEnd;
                          const value = textarea.value;
                          textarea.value = value.substring(0, start) + '\n' + value.substring(end);
                          textarea.selectionStart = textarea.selectionEnd = start + 1;
                          setPrompt(textarea.value);
                        }
                      }}
                      placeholder="Upload and Ask me anything!"
                      className="chat-input"
                      rows={1}
                    />
                  </div>
                  
                  {/* 하단: 아이콘 영역 */}
                  <div className="chat-input-toolbar">
                    <div className="toolbar-left">
                      <label htmlFor="chat-file-upload" className="toolbar-icon-btn">
                        <FaPlus />
                        <input
                          id="chat-file-upload"
                          type="file"
                          accept=".csv,.doc,.docx,.pdf,.xlsx,.xls"
                          onChange={handleFileUpload}
                          style={{ display: 'none' }}
                        />
                      </label>
                      <button className="toolbar-icon-btn" title="언어 설정">
                        <FaGlobe />
                      </button>
                      <button className="toolbar-icon-btn" title="검색">
                        <FaSearch />
                      </button>
                      <button className="toolbar-icon-btn" title="마우스 모드">
                        <FiMousePointer />
                      </button>
                      <button className="toolbar-icon-btn" title="텍스트 서식">
                        <FiType />
                      </button>
                    </div>
                    
                    <div className="toolbar-right">
                      <button type="submit" className="chat-submit-btn">
                        <FaArrowUp />
                      </button>
                    </div>
                  </div>
                  
                  {/* 모드 선택 태그들 */}
                  <div className="mode-selector">
                    <button 
                      className={`mode-tag ${selectedMode === 'default' ? 'active' : ''}`}
                      onClick={() => setSelectedMode('default')}
                    >
                      <FaBrain className="mode-icon" />
                      <span className="mode-text">Default</span>
                      <FiChevronDown className="mode-dropdown" />
                    </button>
                    
                    <button 
                      className={`mode-tag ${selectedMode === 'tools' ? 'active' : ''}`}
                      onClick={() => setSelectedMode('tools')}
                    >
                      <FaCog className="mode-icon" />
                      <span className="mode-text">Tools</span>
                      <FiChevronDown className="mode-dropdown" />
                    </button>
                    
                    <button 
                      className={`mode-tag ${selectedMode === 'reasoning' ? 'active' : ''}`}
                      onClick={() => setSelectedMode('reasoning')}
                    >
                      <FaBrain className="mode-icon" />
                      <span className="mode-text">Advanced Reasoning</span>
                    </button>
                    
                    <button 
                      className={`mode-tag ${selectedMode === 'memory' ? 'active' : ''}`}
                      onClick={() => setSelectedMode('memory')}
                    >
                      <FaMemory className="mode-icon" />
                      <span className="mode-text">Extended Memory</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chat Search Modal */}
      <ChatSearchModal
        isOpen={isChatSearchModalOpen}
        onClose={handleChatSearchModalClose}
        chatSessions={chatSessions}
        onSelectChat={handleChatSearchSelect}
        truncateTitle={truncateTitle}
      />

      {/* Rename Chat Modal */}
      <RenameChatModal
        isOpen={isRenameModalOpen}
        onClose={closeRenameModal}
        currentTitle={selectedSessionForRename?.title || ''}
        onRename={handleRenameChat}
      />


    </div>
  );
};

export default Dashboard; 