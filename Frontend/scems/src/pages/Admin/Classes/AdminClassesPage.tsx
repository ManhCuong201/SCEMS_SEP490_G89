import React, { useEffect, useState } from 'react';
import classService, { ClassResponse } from '../../../services/class.service';
import { DataTable, Column } from '../../../components/Common/DataTable';
import { Loading } from '../../../components/Common/Loading';
import { Alert } from '../../../components/Common/Alert';
import { useNavigate } from 'react-router-dom';
import { Users, Search, Upload } from 'lucide-react';

export const AdminClassesPage: React.FC = () => {
    const navigate = useNavigate();
    const [classes, setClasses] = useState<ClassResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [search, setSearch] = useState('');
    const [importing, setImporting] = useState(false);

    useEffect(() => {
        loadClasses();
    }, []);

    const loadClasses = async () => {
        try {
            setLoading(true);
            const data = await classService.getAllClasses();
            setClasses(data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load classes');
        } finally {
            setLoading(false);
        }
    };

    const columns: Column<ClassResponse>[] = [
        { header: 'Class Code', accessor: 'classCode' },
        { header: 'Subject', accessor: 'subjectName' },
        {
            header: 'Actions',
            accessor: 'id',
            render: (row) => (
                <button
                    className="btn btn-outline btn-sm"
                    onClick={() => navigate(`/admin/classes/${row.id}/students`)}
                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <Users size={16} />
                    Manage Students
                </button>
            )
        }
    ];

    const filteredClasses = classes.filter(c =>
        c.classCode.toLowerCase().includes(search.toLowerCase()) ||
        c.subjectName.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1>Manage Classes</h1>
                    <p className="subtitle">View and manage all classes</p>
                </div>
            </div>

            {error && <Alert type="error" message={error} onClose={() => setError('')} />}
            {successMsg && <Alert type="success" message={successMsg} onClose={() => setSuccessMsg('')} />}

            <div className="card">
                <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ position: 'relative', width: '300px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Search classes..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ paddingLeft: '2.5rem', width: '100%' }}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button
                            className="btn btn-secondary"
                            onClick={() => classService.downloadBulkTemplate()}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <Upload size={18} style={{ transform: 'rotate(180deg)' }} />
                            Download Template
                        </button>
                        <label className={`btn btn-primary ${importing ? 'disabled' : ''}`} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Upload size={18} />
                            {importing ? 'Importing...' : 'Import Students'}
                            <input
                                type="file"
                                accept=".xlsx, .xls"
                                style={{ display: 'none' }}
                                disabled={importing}
                                onChange={async (e) => {
                                    const file = e.target.files?.[0]
                                    if (!file) return

                                    setImporting(true)
                                    setError('')
                                    setSuccessMsg('')
                                    try {
                                        const resp = await classService.importStudentsToClasses(file)
                                        setSuccessMsg(resp.message || 'Students imported successfully')
                                        // Reload not strictly necessary since students are in sub-pages, but doing it for consistency
                                        loadClasses()
                                    } catch (err: any) {
                                        setError(err.response?.data?.message || 'Failed to import students')
                                    } finally {
                                        setImporting(false)
                                        e.target.value = ''
                                    }
                                }}
                            />
                        </label>
                    </div>
                </div>

                {loading ? (
                    <Loading />
                ) : (
                    <DataTable
                        columns={columns}
                        data={filteredClasses}
                        emptyMessage="No classes found."
                    />
                )}
            </div>
        </div>
    );
};
