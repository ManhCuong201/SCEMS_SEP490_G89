import React from 'react';
import ReactDOM from 'react-dom';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
    isDanger?: boolean;
    showInput?: boolean;
    onConfirmWithReason?: (reason: string) => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = 'Xác nhận',
    cancelText = 'Hủy',
    isDanger = false,
    showInput = false,
    onConfirmWithReason
}) => {
    const [reason, setReason] = React.useState('');

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (showInput && onConfirmWithReason) {
            onConfirmWithReason(reason);
        } else {
            onConfirm();
        }
    };

    return ReactDOM.createPortal(
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            backdropFilter: 'blur(4px)'
        }}>
            <div className="glass-panel" style={{
                width: '100%',
                maxWidth: '400px',
                padding: '2rem',
                margin: '1rem',
                backgroundColor: '#ffffff', // Force white bg
                color: '#1e293b', // Force dark text
                boxShadow: 'var(--shadow-xl)',
                position: 'relative',
                zIndex: 10001
            }}>
                <h3 style={{ marginBottom: '1rem', color: '#0f172a', fontWeight: 'bold' }}>{title}</h3>
                <p style={{ marginBottom: showInput ? '1rem' : '2rem', color: '#475569', lineHeight: '1.6' }}>{message}</p>

                {showInput && (
                    <div style={{ marginBottom: '1.5rem' }}>
                        <textarea
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0',
                                backgroundColor: '#f8fafc',
                                color: '#1e293b',
                                fontSize: '0.9rem',
                                minHeight: '80px',
                                resize: 'none',
                                outline: 'none'
                            }}
                            placeholder="Nhập lý do tại đây..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            autoFocus
                        />
                    </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                    <button className="btn btn-secondary" onClick={onCancel}>
                        {cancelText}
                    </button>
                    <button
                        className={`btn ${isDanger ? 'btn-danger' : 'btn-primary'}`}
                        style={isDanger ? { backgroundColor: 'var(--color-danger)', color: 'white' } : {}}
                        onClick={handleConfirm}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
