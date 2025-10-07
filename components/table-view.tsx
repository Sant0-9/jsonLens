"use client"

import { useMemo, useState } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { JsonValue } from '@/store/json-store';
import { isJsonArray, isJsonObject } from '@/lib/json-parser';

interface TableViewProps {
  data: JsonValue;
}

type SortDirection = 'asc' | 'desc' | null;

export function TableView({ data }: TableViewProps) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const { columns, rows } = useMemo(() => {
    if (!isJsonArray(data)) {
      return { columns: ['Value'], rows: [[data]] };
    }

    if (data.length === 0) {
      return { columns: [], rows: [] };
    }

    // Check if array contains objects
    const firstItem = data[0];
    if (!isJsonObject(firstItem)) {
      // Array of primitives
      return {
        columns: ['Index', 'Value'],
        rows: data.map((item, index) => [index, item]),
      };
    }

    // Extract all unique keys from all objects
    const allKeys = new Set<string>();
    data.forEach((item) => {
      if (isJsonObject(item)) {
        Object.keys(item).forEach((key) => allKeys.add(key));
      }
    });

    const columns = Array.from(allKeys);
    const rows = data.map((item) => {
      if (isJsonObject(item)) {
        return columns.map((col) => item[col] ?? null);
      }
      return [];
    });

    return { columns, rows };
  }, [data]);

  const sortedRows = useMemo(() => {
    if (!sortColumn || !sortDirection) {
      return rows;
    }

    const columnIndex = columns.indexOf(sortColumn);
    if (columnIndex === -1) {
      return rows;
    }

    return [...rows].sort((a, b) => {
      const aVal = a[columnIndex];
      const bVal = b[columnIndex];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      let comparison = 0;
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        comparison = aVal.localeCompare(bVal);
      } else if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal;
      } else {
        comparison = String(aVal).localeCompare(String(bVal));
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [rows, columns, sortColumn, sortDirection]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortColumn(null);
        setSortDirection(null);
      }
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const formatValue = (value: JsonValue): string => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  };

  if (!isJsonArray(data) || data.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p>Table view is only available for arrays of objects.</p>
        <p className="text-sm mt-2">Try using Tree view instead.</p>
      </div>
    );
  }

  return (
    <div className="overflow-auto">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-muted/50 sticky top-0 z-10">
          <tr>
            {columns.map((column) => (
              <th
                key={column}
                className="text-left p-3 font-semibold border-b"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 hover:bg-transparent"
                  onClick={() => handleSort(column)}
                >
                  <span className="mr-2">{column}</span>
                  {sortColumn === column ? (
                    sortDirection === 'asc' ? (
                      <ArrowUp className="h-3 w-3" />
                    ) : (
                      <ArrowDown className="h-3 w-3" />
                    )
                  ) : (
                    <ArrowUpDown className="h-3 w-3 opacity-30" />
                  )}
                </Button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className="hover:bg-accent/30 transition-colors border-b last:border-b-0"
            >
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="p-3 font-mono text-xs">
                  {typeof cell === 'string' && (
                    <span className="text-green-600 dark:text-green-400">
                      {cell}
                    </span>
                  )}
                  {typeof cell === 'number' && (
                    <span className="text-purple-600 dark:text-purple-400">
                      {cell}
                    </span>
                  )}
                  {typeof cell === 'boolean' && (
                    <span className="text-red-600 dark:text-red-400">
                      {cell.toString()}
                    </span>
                  )}
                  {cell === null && (
                    <span className="text-orange-600 dark:text-orange-400">
                      null
                    </span>
                  )}
                  {typeof cell === 'object' && cell !== null && (
                    <span className="text-muted-foreground">
                      {formatValue(cell)}
                    </span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="p-4 text-xs text-muted-foreground text-center border-t">
        Showing {sortedRows.length} rows
      </div>
    </div>
  );
}
