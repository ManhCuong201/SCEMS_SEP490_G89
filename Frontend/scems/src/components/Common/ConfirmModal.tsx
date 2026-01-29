import React from 'react';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
    isDanger?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isDanger = false
}) => {
    if (!isOpen) return null;

    return (
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
            zIndex: 1000,
            backdropFilter: 'blur(4px)'
        }}>
            <div className="glass-panel" style={{
                width: '100%',
                maxWidth: '400px',
                padding: '2rem',
                margin: '1rem',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-main)',
                boxShadow: 'var(--shadow-xl)'
            }}>
                <h3 style={{ marginBottom: '1rem', color: 'var(--text-main)' }}>{title}</h3>
                <p style={{ marginBottom: '2rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>{message}</p>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                    <button className="btn btn-secondary" onClick={onCancel}>
                        {cancelText}
                    </button>
                    <button
                        className={`btn ${isDanger ? 'btn-danger' : 'btn-primary'}`}
                        style={isDanger ? { backgroundColor: 'var(--color-danger)', color: 'white' } : {}}
                        onClick={onConfirm}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};
