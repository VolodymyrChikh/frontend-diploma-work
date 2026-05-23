import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';

const NOTIFICATION_TYPES = [
    { value: 'Admin Message', label: 'Повідомлення від адміністратора' },
    { value: 'Behavior Warning', label: 'Попередження про поведінку' },
    { value: 'Inappropriate Content', label: 'Неприйнятний контент' },
    { value: 'Content Reported', label: 'Скарга на контент' },
    { value: 'System', label: 'Системне сповіщення' },
];

function DeleteConfirmation({
    open,
    title,
    message,
    reasonLabel = 'Причина',
    notificationTypeLabel = 'Тип сповіщення',
    onCancel,
    onConfirm,
}) {
    const [reason, setReason] = useState('');
    const [notificationType, setNotificationType] = useState(NOTIFICATION_TYPES[0].value);

    useEffect(() => {
        function onKey(e) {
            if (e.key === 'Escape' && open) onCancel();
        }
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [open, onCancel]);

    useEffect(() => {
        if (open) {
            setReason('');
            setNotificationType(NOTIFICATION_TYPES[0].value);
        }
    }, [open]);

    if (!open) return null;

    const handleConfirm = () => {
        const trimmedReason = reason.trim();
        if (!trimmedReason) return;
        onConfirm({ reason: trimmedReason, notificationType });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg rounded-ami bg-white p-6 shadow-lg">
                <h3 className="mb-2 text-lg font-black text-ink">{title}</h3>
                {message && <p className="mb-4 text-sm text-muted">{message}</p>}

                <label className="mb-2 block text-sm font-bold text-ink">{reasonLabel}</label>
                <textarea
                    className="mb-4 h-24 w-full rounded-md border border-border p-3 text-sm text-ink outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/15"
                    placeholder="Вкажіть причину для сповіщення користувача"
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    required
                />

                <label className="mb-2 block text-sm font-bold text-ink">{notificationTypeLabel}</label>
                <select
                    className="mb-4 w-full rounded-md border border-border bg-white p-3 text-sm text-ink outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/15"
                    value={notificationType}
                    onChange={(event) => setNotificationType(event.target.value)}
                >
                    {NOTIFICATION_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                            {type.label}
                        </option>
                    ))}
                </select>

                <div className="flex justify-end gap-2">
                    <button type="button" onClick={onCancel} className="inline-flex items-center gap-2 rounded-ami border border-border bg-white px-4 py-2 text-sm font-black text-ink">Скасувати</button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={!reason.trim()}
                        className="inline-flex items-center gap-2 rounded-ami bg-red-700 px-4 py-2 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Видалити
                    </button>
                </div>
            </div>
        </div>
    );
}

DeleteConfirmation.propTypes = {
    open: PropTypes.bool,
    title: PropTypes.string,
    message: PropTypes.string,
    reasonLabel: PropTypes.string,
    notificationTypeLabel: PropTypes.string,
    onCancel: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired,
};

export default DeleteConfirmation;
