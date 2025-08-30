export interface TableData {
  headers: string[];
  rows: any[][];
  title?: string;
}

/**
 * 마크다운 테이블 텍스트를 파싱하여 테이블 데이터로 변환
 */
export function parseMarkdownTable(markdownText: string): TableData | null {
  // 테이블 패턴 매칭 (|로 구분된 행들)
  const tablePattern = /(\|[^\n]*\|[^\n]*\n)+/;
  const match = markdownText.match(tablePattern);
  
  if (!match) return null;
  
  const tableText = match[0];
  const lines = tableText.trim().split('\n');
  
  if (lines.length < 2) return null;
  
  // 헤더 행 파싱
  const headerLine = lines[0];
  const headers = headerLine
    .split('|')
    .slice(1, -1) // 첫 번째와 마지막 빈 문자열 제거
    .map(header => header.trim())
    .filter(header => header.length > 0);
  
  // 구분선 제거 (두 번째 행)
  const dataLines = lines.slice(2);
  
  // 데이터 행 파싱
  const rows = dataLines
    .filter(line => line.trim().length > 0)
    .map(line => {
      return line
        .split('|')
        .slice(1, -1) // 첫 번째와 마지막 빈 문자열 제거
        .map(cell => cell.trim())
        .filter(cell => cell.length > 0);
    });
  
  // 테이블 제목 추출 시도
  let title: string | undefined;
  const titleMatch = markdownText.match(/^#+\s*(.+)$/m);
  if (titleMatch) {
    title = titleMatch[1].trim();
  }
  
  return {
    headers,
    rows,
    title
  };
}

/**
 * CSV 형태의 데이터를 테이블 데이터로 변환
 */
export function parseCSVData(csvText: string): TableData | null {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return null;
  
  // 헤더 행 파싱
  const headers = lines[0]
    .split(',')
    .map(header => header.trim().replace(/"/g, ''))
    .filter(header => header.length > 0);
  
  // 데이터 행 파싱
  const rows = lines.slice(1)
    .filter(line => line.trim().length > 0)
    .map(line => {
      return line
        .split(',')
        .map(cell => cell.trim().replace(/"/g, ''))
        .filter(cell => cell.length > 0);
    });
  
  return {
    headers,
    rows
  };
}

/**
 * 일반 텍스트에서 테이블 구조를 감지하고 변환
 */
export function detectTableStructure(text: string): TableData | null {
  // 여러 줄로 된 데이터에서 테이블 구조 감지
  const lines = text.trim().split('\n');
  if (lines.length < 2) return null;
  
  // 첫 번째 행을 헤더로 가정하고 분석
  const firstLine = lines[0];
  const potentialHeaders = firstLine.split(/\s+/).filter(item => item.length > 0);
  
  // 헤더가 너무 적거나 너무 많으면 테이블이 아닐 가능성
  if (potentialHeaders.length < 2 || potentialHeaders.length > 10) return null;
  
  // 데이터 행들이 헤더와 비슷한 구조를 가지고 있는지 확인
  const dataLines = lines.slice(1);
  const isValidTable = dataLines.every(line => {
    const cells = line.split(/\s+/).filter(item => item.length > 0);
    return cells.length === potentialHeaders.length;
  });
  
  if (!isValidTable) return null;
  
  // 헤더와 데이터 추출
  const headers = potentialHeaders;
  const rows = dataLines.map(line => {
    return line.split(/\s+/).filter(item => item.length > 0);
  });
  
  return {
    headers,
    rows
  };
}

/**
 * 강화된 테이블 구조 감지 - 더 정확한 패턴 매칭
 */
export function detectEnhancedTableStructure(text: string): TableData | null {
  // 줄바꿈으로 분리
  const lines = text.trim().split('\n').filter(line => line.trim().length > 0);
  if (lines.length < 3) return null; // 최소 3줄 필요 (헤더 + 데이터 2줄)
  
  // 첫 번째 줄을 헤더로 시도
  const firstLine = lines[0];
  let headers: string[] = [];
  
  // 다양한 구분자로 헤더 파싱 시도
  if (firstLine.includes('|')) {
    // 마크다운 테이블 스타일
    headers = firstLine
      .split('|')
      .map(header => header.trim())
      .filter(header => header.length > 0);
  } else if (firstLine.includes(',')) {
    // CSV 스타일
    headers = firstLine
      .split(',')
      .map(header => header.trim().replace(/"/g, ''))
      .filter(header => header.length > 0);
  } else {
    // 공백으로 구분된 스타일
    headers = firstLine
      .split(/\s+/)
      .filter(item => item.length > 0);
  }
  
  if (headers.length < 2 || headers.length > 15) return null;
  
  // 데이터 행들 파싱
  const dataLines = lines.slice(1);
  const rows: string[][] = [];
  
  for (const line of dataLines) {
    let cells: string[] = [];
    
    if (line.includes('|')) {
      cells = line
        .split('|')
        .map(cell => cell.trim())
        .filter(cell => cell.length > 0);
    } else if (line.includes(',')) {
      cells = line
        .split(',')
        .map(cell => cell.trim().replace(/"/g, ''))
        .filter(cell => cell.length > 0);
    } else {
      cells = line
        .split(/\s+/)
        .filter(item => item.length > 0);
    }
    
    // 헤더 수와 일치하는지 확인
    if (cells.length === headers.length) {
      rows.push(cells);
    }
  }
  
  // 유효한 데이터 행이 최소 2개 이상 있어야 함
  if (rows.length < 2) return null;
  
  return {
    headers,
    rows
  };
}

/**
 * AI 답변에서 테이블 데이터를 추출하는 메인 함수
 */
export function extractTableFromAIResponse(response: string): TableData | null {
  // 1. 마크다운 테이블 먼저 시도
  const markdownTable = parseMarkdownTable(response);
  if (markdownTable) return markdownTable;
  
  // 2. CSV 형태 데이터 시도
  const csvTable = parseCSVData(response);
  if (csvTable) return csvTable;
  
  // 3. 강화된 테이블 구조 감지
  const enhancedTable = detectEnhancedTableStructure(response);
  if (enhancedTable) return enhancedTable;
  
  // 4. 일반 텍스트에서 테이블 구조 감지
  const detectedTable = detectTableStructure(response);
  if (detectedTable) return detectedTable;
  
  return null;
} 