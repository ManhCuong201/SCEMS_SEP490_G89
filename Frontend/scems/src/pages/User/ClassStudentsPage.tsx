import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import classService, { ClassResponse, EnrolledStudent } from '../../services/class.service';
import { DataTable, Column } from '../../components/Common/DataTable';
import { Loading } from '../../components/Common/Loading';
import { Alert } from '../../components/Common/Alert';
import { ArrowLeft, Upload } from 'lucide-react';

const ClassStudentsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [students, setStudents] = useState<EnrolledStudent[]>([]);
    const [classInfo, setClassInfo] = useState<ClassResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [importing, setImporting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const location = useLocation();
    const isAdminRoute = location.pathname.startsWith('/admin');

    useEffect(() => {
        if (id) loadData(id);
    }, [id]);

    const loadData = async (classId: string) => {
        try {
            const [classDetails, studentsData] = await Promise.all([
                classService.getClassById(classId),
                classService.getClassStudents(classId)
            ]);

            setClassInfo(classDetails);
            setStudents(studentsData);
        } catch (err: any) {
            setError('Failed to load class information');
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !id) return;

        setImporting(true);
        setError(null);
        try {
            await classService.importStudents(id, file);
            setSuccess('Students imported successfully!');
            loadData(id);
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to import students');
        } finally {
            setImporting(false);
            e.target.value = ''; // Reset input
        }
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status.toLowerCase()) {
            case 'active': return 'badge-success';
            case 'blocked': return 'badge-danger';
            case 'pending': return 'badge-warning';
            default: return 'badge-secondary';
        }
    };

    const columns: Column<EnrolledStudent>[] = [
        { header: 'Full Name', accessor: 'fullName' },
        { header: 'Email', accessor: 'email' },
        { header: 'Student Code', accessor: 'studentCode' },
        {
            header: 'Status',
            accessor: (item: EnrolledStudent) => (
                <span className={`badge ${getStatusBadgeClass(item.status)}`}>
                    {item.status}
                </span>
            )
        }
    ];

    if (loading) return <Loading />;

    const handleBack = () => {
        if (isAdminRoute) {
            navigate('/admin/classes');
        } else {
            navigate('/teacher/classes');
        }
    };

    return (
        <div className="page-container">
            <div className="page-header compact-page-header" style={{ alignItems: 'center', justifyContent: 'space-between', display: 'flex' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button className="btn btn-outline btn-sm" onClick={handleBack}>
                        <ArrowLeft size={16} />
                    </button>
                    <div>
                        <h2>{classInfo?.classCode} - Student List</h2>
                        <small className="text-muted">{classInfo?.subjectName}</small>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => classService.downloadTemplate()}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                        <Upload size={16} style={{ transform: 'rotate(180deg)' }} />
                        Download Template
                    </button>
                    <label className={`btn btn-primary btn-sm ${importing ? 'disabled' : ''}`} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Upload size={16} />
                        {importing ? 'Importing...' : 'Import Students'}
                        <input type="file" accept=".xlsx, .xls" hidden onChange={handleImport} disabled={importing} />
                    </label>
                </div>
            </div>

            {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
            {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}

            <div className="glass-card">
                <DataTable
                    columns={columns}
                    data={students}
                    emptyMessage="No students enrolled in this class yet. Use the Import button to add them."
                />
            </div>
        </div>
    );
};

export default ClassStudentsPage;
