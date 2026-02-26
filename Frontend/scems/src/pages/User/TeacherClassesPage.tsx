import React, { useEffect, useState } from 'react';
import classService, { ClassResponse } from '../../services/class.service';
import { DataTable, Column } from '../../components/Common/DataTable';
import { Loading } from '../../components/Common/Loading';
import { Alert } from '../../components/Common/Alert';
import { useNavigate } from 'react-router-dom';
import { Users } from 'lucide-react';

const TeacherClassesPage: React.FC = () => {
    const [classes, setClasses] = useState<ClassResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        loadClasses();
    }, []);

    const loadClasses = async () => {
        try {
            const data = await classService.getTeacherClasses();
            setClasses(data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Tải danh sách lớp học thất bại');
        } finally {
            setLoading(false);
        }
    };

    const columns: Column<ClassResponse>[] = [
        { header: 'Mã lớp', accessor: 'classCode' },
        { header: 'Môn học', accessor: 'subjectName' },
        {
            header: 'Hành động',
            accessor: (item: ClassResponse) => (
                <button
                    className="btn btn-primary btn-sm"
                    onClick={() => navigate(`/teacher/classes/${item.id}/students`)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                    <Users size={16} />
                    Quản lý Sinh viên
                </button>
            )
        }
    ];

    if (loading) return <Loading />;

    return (
        <div className="page-container">
            <div className="page-header compact-page-header">
                <h2>Lớp học của tôi</h2>
            </div>

            {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

            <div className="glass-card">
                <DataTable
                    columns={columns}
                    data={classes}
                    emptyMessage="Bạn chưa được phân công lớp học nào."
                />
            </div>
        </div>
    );
};

export default TeacherClassesPage;
