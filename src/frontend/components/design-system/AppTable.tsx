import React from 'react';

interface AppTableProps {
  headers: string[];
  children: React.ReactNode;
  className?: string;
  onRowClick?: (id: string | number) => void;
}

export const AppTable: React.FC<AppTableProps> = ({ headers, children, className = '' }) => {
  return (
    <div
      className={`bg-white rounded-[2.5rem] border border-stone-200 shadow-card overflow-hidden ${className}`}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-stone-50 border-b border-stone-100">
            <tr>
              {headers.map((header, i) => (
                <th
                  key={i}
                  className="px-8 py-5 text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em]"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-50">{children}</tbody>
        </table>
      </div>
    </div>
  );
};

interface AppTableRowProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export const AppTableRow: React.FC<AppTableRowProps> = ({ children, onClick, className = '' }) => {
  return (
    <tr
      onClick={onClick}
      className={`
                hover:bg-stone-50/80 transition-all duration-300 group
                ${onClick ? 'cursor-pointer' : ''}
                ${className}
            `}
    >
      {children}
    </tr>
  );
};

export const AppTableCell: React.FC<{
  children: React.ReactNode;
  className?: string;
  colSpan?: number;
}> = ({ children, className = '', colSpan }) => {
  return (
    <td colSpan={colSpan} className={`px-8 py-5 text-sm ${className}`}>
      {children}
    </td>
  );
};
