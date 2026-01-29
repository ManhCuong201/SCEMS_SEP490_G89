import React from 'react'
import { Loading } from './Loading'

export interface Column<T> {
    header: string
    accessor: keyof T | ((item: T) => React.ReactNode)
    render?: (item: T) => React.ReactNode
    width?: string
}

interface DataTableProps<T> {
    columns: Column<T>[]
    data: T[]
    isLoading?: boolean
    emptyMessage?: string
    onRowClick?: (item: T) => void
}

export function DataTable<T extends { id: string | number }>({
    columns,
    data,
    isLoading,
    emptyMessage = 'No data found',
    onRowClick
}: DataTableProps<T>) {
    if (isLoading) {
        return (
            <div style={{ padding: '3rem', display: 'flex', justifyContent: 'center' }}>
                <Loading />
            </div>
        )
    }

    if (data.length === 0) {
        return (
            <div style={{
                padding: '3rem',
                textAlign: 'center',
                color: 'var(--text-muted)',
                background: 'var(--bg-glass)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-glass)'
            }}>
                <p>{emptyMessage}</p>
            </div>
        )
    }

    return (
        <div className="table-wrapper glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="glass-table">
                <thead>
                    <tr>
                        {columns.map((col, index) => (
                            <th key={index} style={{ width: col.width }}>
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((item) => (
                        <tr
                            key={item.id}
                            onClick={() => onRowClick && onRowClick(item)}
                            style={{ cursor: onRowClick ? 'pointer' : 'default' }}
                        >
                            {columns.map((col, index) => (
                                <td key={index}>
                                    {col.render ? (
                                        col.render(item)
                                    ) : typeof col.accessor === 'function' ? (
                                        col.accessor(item)
                                    ) : (
                                        (item[col.accessor] as React.ReactNode)
                                    )}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
