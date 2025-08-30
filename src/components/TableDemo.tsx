import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import InteractiveTable from './InteractiveTable';

// 샘플 데이터 타입
interface SampleData {
  id: number;
  name: string;
  email: string;
  age: number;
  city: string;
  status: string;
}

// 샘플 데이터
const sampleData: SampleData[] = [
  { id: 1, name: '김철수', email: 'kim@example.com', age: 25, city: '서울', status: '활성' },
  { id: 2, name: '이영희', email: 'lee@example.com', age: 30, city: '부산', status: '활성' },
  { id: 3, name: '박민수', email: 'park@example.com', age: 28, city: '대구', status: '비활성' },
  { id: 4, name: '최지영', email: 'choi@example.com', age: 35, city: '인천', status: '활성' },
  { id: 5, name: '정현우', email: 'jung@example.com', age: 27, city: '광주', status: '활성' },
  { id: 6, name: '한소영', email: 'han@example.com', age: 32, city: '대전', status: '비활성' },
  { id: 7, name: '윤태호', email: 'yoon@example.com', age: 29, city: '울산', status: '활성' },
  { id: 8, name: '송미라', email: 'song@example.com', age: 31, city: '세종', status: '활성' },
  { id: 9, name: '임동현', email: 'lim@example.com', age: 26, city: '제주', status: '활성' },
  { id: 10, name: '강수진', email: 'kang@example.com', age: 33, city: '강릉', status: '비활성' },
];

// 컬럼 정의
const columns: ColumnDef<SampleData>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    cell: ({ row }) => <span className="cell-id">{row.getValue('id')}</span>,
    enableSorting: true,
  },
  {
    accessorKey: 'name',
    header: '이름',
    cell: ({ row }) => <span className="cell-name">{row.getValue('name')}</span>,
    enableSorting: true,
  },
  {
    accessorKey: 'email',
    header: '이메일',
    cell: ({ row }) => <span className="cell-email">{row.getValue('email')}</span>,
    enableSorting: true,
  },
  {
    accessorKey: 'age',
    header: '나이',
    cell: ({ row }) => <span className="cell-age">{row.getValue('age')}세</span>,
    enableSorting: true,
  },
  {
    accessorKey: 'city',
    header: '도시',
    cell: ({ row }) => <span className='cell-city'>{row.getValue('city')}</span>,
    enableSorting: true,
  },
  {
    accessorKey: 'status',
    header: '상태',
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      return (
        <span className={`cell-status ${status === '활성' ? 'active' : 'inactive'}`}>
          {status}
        </span>
      );
    },
    enableSorting: true,
  },
];

const TableDemo: React.FC = () => {
  return (
    <div className="table-demo">
      <h2>Interactive Table 데모</h2>
      <p>컬럼 헤더를 클릭하여 정렬하고, 검색창에서 전체 검색을 해보세요!</p>
      
      <InteractiveTable
        data={sampleData}
        columns={columns}
        title="사용자 목록"
      />
    </div>
  );
};

export default TableDemo; 