import React, { useState, useMemo, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  flexRender,
} from '@tanstack/react-table';
import { MdSort, MdSortByAlpha, MdKeyboardArrowDown, MdSearch, MdNavigateNext, MdNavigateBefore, MdFirstPage, MdLastPage, MdDownload, MdFileDownload, MdExpand } from 'react-icons/md';
import './InteractiveTable.css';

interface InteractiveTableProps {
  data: any[];
  columns: ColumnDef<any>[];
  title?: string;
}

const InteractiveTable: React.FC<InteractiveTableProps> = ({ data, columns, title }) => {
  console.log('InteractiveTable props:', { data, columns, title });
  
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target as Node)) {
        setExportDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // CSV 다운로드 함수
  const downloadCSV = () => {
    const allData = table.getFilteredRowModel().rows.map(row => {
      const rowData: any = {};
      columns.forEach(column => {
        const columnId = column.id || (column as any).accessorKey;
        if (columnId) {
          rowData[columnId] = row.getValue(columnId);
        }
      });
      return rowData;
    });

    const headers = columns.map(col => col.header).filter(Boolean);
    const csvContent = [
      headers.join(','),
      ...allData.map(row => 
        Object.values(row).map(value => 
          typeof value === 'string' && value.includes(',') ? `"${value}"` : value
        ).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${title || 'table-data'}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setExportDropdownOpen(false);
  };

  // XLSX 다운로드 함수
  const downloadXLSX = () => {
    const allData = table.getFilteredRowModel().rows.map(row => {
      const rowData: any = {};
      columns.forEach(column => {
        const columnId = column.id || (column as any).accessorKey;
        if (columnId) {
          rowData[columnId] = row.getValue(columnId);
        }
      });
      return rowData;
    });

    const headers = columns.map(col => col.header).filter(Boolean);
    
    // 헤더와 데이터를 포함한 워크시트 생성
    const ws = XLSX.utils.json_to_sheet(allData, { header: Object.keys(allData[0] || {}) });
    
    // 워크북 생성 및 워크시트 추가
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    
    // 파일 다운로드
    XLSX.writeFile(wb, `${title || 'table-data'}.xlsx`);
    setExportDropdownOpen(false);
  };

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const getSortIcon = (column: any) => {
    if (!column.getCanSort()) return null;
    
    if (column.getIsSorted() === 'asc') {
      return <MdSortByAlpha className="sort-icon active" />;
    } else if (column.getIsSorted() === 'desc') {
      return <MdKeyboardArrowDown className="sort-icon active" />;
    }
    return <MdSort className="sort-icon" />;
  };

  return (
    <div className="interactive-table-container">
      {title && (
        <div className="table-title-header">
          <h3 className="table-title-text">{title}</h3>
        </div>
      )}
      
      {/* 새로운 툴바 */}
      <div className="table-toolbar">
        <div className="search-input-container">
          <MdSearch className="search-icon" />
          <input
            type="text"
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Search all..."
            className="global-search-input"
          />
        </div>
        
        <div className="toolbar-controls">
          <div className="export-dropdown" ref={exportDropdownRef}>
            <button 
              className="toolbar-btn"
              onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
            >
              <MdDownload className="toolbar-btn-icon" />
              <span>Export</span>
            </button>
            <div className={`export-dropdown-content ${exportDropdownOpen ? 'show' : ''}`}>
              <a href="#" onClick={(e) => { e.preventDefault(); downloadCSV(); }}>
                .csv
              </a>
              <a href="#" onClick={(e) => { e.preventDefault(); downloadXLSX(); }}>
                .xlsx
              </a>
            </div>
          </div>
          
          <button className="toolbar-btn">
            <MdFileDownload className="toolbar-btn-icon" />
            <span>Export to Sheets</span>
          </button>
          <button className="toolbar-btn">
            <MdExpand className="toolbar-btn-icon" />
            <span>Expand</span>
          </button>
          
          <div className="page-size-selector">
            <select
              value={table.getState().pagination.pageSize}
              onChange={(e) => {
                table.setPageSize(Number(e.target.value));
              }}
              className="page-size-select"
            >
              {[10, 20, 50, 100].map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  {pageSize}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 테이블 */}
      <div className="table-wrapper">
        <table className="interactive-table">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={`table-header ${header.column.getCanSort() ? 'sortable' : ''}`}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="header-content">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {getSortIcon(header.column)}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="table-row">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="table-cell">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      <div className="pagination-controls">
        <div className="pagination-info">
          <span>
            {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}-
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              table.getFilteredRowModel().rows.length
            )}{' '}
            / {table.getFilteredRowModel().rows.length} items
          </span>
        </div>
        
        <div className="pagination-buttons">
          <button
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            className="pagination-btn"
          >
            <MdFirstPage />
          </button>
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="pagination-btn"
          >
            <MdNavigateBefore />
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="pagination-btn"
          >
            <MdNavigateNext />
          </button>
          <button
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            className="pagination-btn"
          >
            <MdLastPage />
          </button>
        </div>
      </div>
    </div>
  );
};

export default InteractiveTable; 