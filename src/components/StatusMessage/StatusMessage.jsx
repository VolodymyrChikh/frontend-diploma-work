import PropTypes from 'prop-types';
import { cn } from '../../ui/cn.js';

const statusStyles = {
  error: 'border-red-200 bg-red-50 text-red-800',
  success: 'border-green-200 bg-green-50 text-green-800',
  info: 'border-blue-200 bg-blue-50 text-blue-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
};

const iconColors = {
  error: 'text-red-600',
  success: 'text-green-600',
  info: 'text-blue-600',
  warning: 'text-amber-600',
};

function StatusIcon({ type }) {
  const cls = cn('size-5 shrink-0', iconColors[type] || iconColors.info);
  if (type === 'error') {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <path d="M15 9l-6 6M9 9l6 6" />
      </svg>
    );
  }
  if (type === 'success') {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <path d="m8 12.5 2.7 2.7L16 9.8" />
      </svg>
    );
  }
  if (type === 'warning') {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.7 3.86a2 2 0 0 0-3.4 0Z" />
        <path d="M12 9v4M12 17h.01" />
      </svg>
    );
  }
  return (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  );
}

StatusIcon.propTypes = {
  type: PropTypes.oneOf(['error', 'info', 'success', 'warning']).isRequired,
};

function StatusMessage({ type = 'info', message, className = '', onDismiss }) {
  if (!message) {
    return null;
  }

  const role = type === 'error' || type === 'warning' ? 'alert' : 'status';

  return (
    <div
      className={cn(
        'ami-fade-in flex w-full items-start gap-3 rounded-ami border px-4 py-3 text-sm/6 font-extrabold',
        statusStyles[type] || statusStyles.info,
        className,
      )}
      role={role}
    >
      <StatusIcon type={type} />
      <span className="min-w-0 flex-1 wrap-break-word">{message}</span>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Закрити повідомлення"
          className="-mr-1 -mt-1 inline-grid size-7 shrink-0 place-items-center rounded-ami border border-transparent text-current opacity-70 transition duration-200 hover:bg-black/5 hover:opacity-100 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-(--color-focus)"
        >
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      ) : null}
    </div>
  );
}

StatusMessage.propTypes = {
  type: PropTypes.oneOf(['error', 'info', 'success', 'warning']),
  message: PropTypes.string,
  className: PropTypes.string,
  onDismiss: PropTypes.func,
};

export default StatusMessage;
