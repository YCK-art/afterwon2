import React from 'react';
import './SheetSelectionModal.css';

interface SheetSelectionModalProps {
  isOpen: boolean;
  fileName: string;
  sheetNames: string[];
  onSheetSelect: (sheetName: string) => void;
  onClose: () => void;
}

const SheetSelectionModal: React.FC<SheetSelectionModalProps> = ({
  isOpen,
  fileName,
  sheetNames,
  onSheetSelect,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="sheet-selection-modal-overlay" onClick={onClose}>
      <div className="sheet-selection-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>시트 선택</h3>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>
        
        <div className="modal-content">
          <p className="file-info">
            <strong>{fileName}</strong> 파일에서 분석할 시트를 선택해주세요.
          </p>
          
          <div className="sheet-list">
            {sheetNames.map((sheetName, index) => (
              <button
                key={index}
                className="sheet-option"
                onClick={() => onSheetSelect(sheetName)}
              >
                <span className="sheet-icon">📊</span>
                <span className="sheet-name">{sheetName}</span>
              </button>
            ))}
          </div>
          
          <div className="modal-footer">
            <p className="info-text">
              여러 시트가 있는 경우, 한 번에 하나의 시트만 분석하는 것이 더 정확합니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SheetSelectionModal; 