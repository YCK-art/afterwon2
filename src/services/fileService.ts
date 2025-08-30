// fileService.ts
// 브라우저 환경용: CSV/TXT → 텍스트, Excel → SheetJS 파싱, PDF → pdfjs-dist 텍스트 추출

import * as XLSX from 'xlsx';

/**
 * PDF 텍스트 추출: pdfjs-dist는 워커 설정이 약간 번거로울 수 있어
 * 여기서는 useWorker: false 로 동작시킵니다(퍼포먼스는 다소 낮지만 설정 간단).
 */
async function extractPdfText(file: File, maxPages = 5): Promise<string> {
  try {
    // 동적 import로 초기 번들 크기 최소화
    const pdfjsLib = await import('pdfjs-dist');
    
    // 워커 미설정으로 인한 오류 방지를 위해 워커 비활성화
    // (프로덕션에선 worker 설정 권장: GlobalWorkerOptions.workerSrc 세팅)
    if (pdfjsLib.GlobalWorkerOptions) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = '';
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    const total = Math.min(pdf.numPages, maxPages);
    let out = `PDF 파일: ${file.name} (${(file.size / 1024).toFixed(2)} KB)\n총 ${pdf.numPages}페이지 중 앞 ${total}페이지 미리보기\n\n`;

    for (let i = 1; i <= total; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const text = content.items.map((it: any) => it.str).join(' ');
      out += `---- Page ${i} ----\n${text}\n\n`;
    }

    // 텍스트가 거의 없으면 안내
    if (out.replace(/\s/g, '').length < 50) {
      out += '※ 텍스트가 거의 감지되지 않았습니다(스캔 PDF 가능성). 표/이미지 기반이면 Tabula, OCR(Tesseract/비전 API) 등 추가처리가 필요할 수 있어요.';
    }

    // 과도한 길이 방지(프런트 표시 안전장치)
    const MAX_CHARS = 100_000;
    if (out.length > MAX_CHARS) out = out.slice(0, MAX_CHARS) + '\n\n…(생략)…';

    return out;
  } catch (error) {
    console.error('PDF 처리 오류:', error);
    return `PDF 파일 처리 중 오류가 발생했습니다: ${(error as Error).message || '알 수 없는 오류'}`;
  }
}

/**
 * Excel 파일의 모든 시트 이름을 가져오기
 */
export const getExcelSheetNames = async (file: File): Promise<string[]> => {
  try {
    const data = new Uint8Array(await file.arrayBuffer());
    const wb = XLSX.read(data, { type: 'array' });
    return wb.SheetNames;
  } catch (error) {
    console.error('Excel 시트 이름 읽기 오류:', error);
    throw new Error('Excel 파일의 시트 정보를 읽을 수 없습니다.');
  }
};

/**
 * Excel 파일의 특정 시트를 CSV로 변환
 */
export const extractExcelSheetAsCsv = async (file: File, sheetName: string): Promise<string> => {
  try {
    const data = new Uint8Array(await file.arrayBuffer());
    const wb = XLSX.read(data, { type: 'array' });

    if (!wb.SheetNames.includes(sheetName)) {
      throw new Error(`시트 "${sheetName}"을 찾을 수 없습니다.`);
    }

    const ws = wb.Sheets[sheetName];
    const csv = XLSX.utils.sheet_to_csv(ws, { FS: ',', RS: '\n' });

    if (!csv.trim()) {
      return `Excel 파일: ${file.name} — 시트 "${sheetName}" 내용이 비어있습니다.`;
    }

    return `Excel 파일: ${file.name} — 시트 "${sheetName}"\n\n${csv}`;
  } catch (error) {
    console.error('Excel 시트 처리 오류:', error);
    throw new Error(`시트 "${sheetName}" 처리 중 오류가 발생했습니다: ${(error as Error).message}`);
  }
};

/**
 * 텍스트 파일 읽기
 */
async function readText(file: File): Promise<string> {
  // 일부 환경에서 인코딩을 지정하지 않으면 깨질 수 있어 명시
  return await file.text();
}

/**
 * 업로드 파일의 내용을 문자열로 반환.
 * - CSV/TXT: 텍스트 그대로
 * - PDF: 앞 n페이지 텍스트 추출
 * - Excel: 첫 시트를 CSV 문자열로 변환
 * - 기타: 메타데이터 안내
 */
export const readFileContent = async (file: File): Promise<string> => {
  const name = file.name.toLowerCase();
  const type = (file.type || '').toLowerCase();

  // 확장자 보조 판별(브라우저가 MIME 비워오는 경우 대비)
  const isCSV  = type === 'text/csv' || /\.csv$/i.test(name);
  const isTXT  = type === 'text/plain' || /\.txt$/i.test(name);
  const isPDF  = type === 'application/pdf' || /\.pdf$/i.test(name);
  const isXLSX = type.includes('spreadsheet') ||
                 type.includes('excel') ||
                 /\.(xlsx|xls)$/i.test(name) ||
                 type === 'application/vnd.ms-excel' ||
                 type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

  try {
    if (isCSV || isTXT) {
      return await readText(file);
    }

    if (isPDF) {
      return await extractPdfText(file, 5); // 앞 5페이지 미리보기
    }

    if (isXLSX) {
      // Excel 파일의 첫 번째 시트를 기본으로 사용
      try {
        const sheetNames = await getExcelSheetNames(file);
        if (sheetNames.length > 0) {
          return await extractExcelSheetAsCsv(file, sheetNames[0]);
        }
      } catch (error) {
        console.error('Excel 파일 처리 오류:', error);
      }
      return `Excel 파일: ${file.name} — 시트를 읽을 수 없습니다.`;
    }

    // 기타 형식 → 메타 정보
    return `파일: ${file.name} (${(file.size / 1024).toFixed(2)} KB)\n지원되지 않는 형식이거나, 본문 추출이 필요 없는 파일입니다.`;
  } catch (err) {
    console.error(err);
    return `파일 처리 중 오류가 발생했습니다: ${(err as Error).message ?? err}`;
  }
};

/**
 * 허용 형식 검증
 */
export const validateFile = (file: File): boolean => {
  const type = (file.type || '').toLowerCase();
  const name = file.name.toLowerCase();

  const allowedTypes = [
    'text/csv',
    'text/plain',
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ];

  const byExtension = /\.(xlsx|xls|csv|txt|pdf)$/i.test(name);

  // 일부 브라우저는 type을 비워서 보내므로 확장자도 함께 허용
  return allowedTypes.includes(type) || byExtension;
}; 