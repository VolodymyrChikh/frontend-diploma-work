import PropsTypes from 'prop-types';
import { useState, useRef, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/auth-context.js';
import { cn } from '../../ui/cn.js';
import DeleteConfirmation from '../DeleteConfirmation/DeleteConfirmation';

function Comment({
    commentId,
    authorAvatar,
    author,
    creationDate,
    commentContent,
    isOwnComment,
    isSaving = false,
    isDeleting = false,
    onEdit,
    onDelete,
}) {
    const { user } = useContext(AuthContext);
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(commentContent);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        setEditedContent(commentContent);
    }, [commentContent]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleEditSubmit = async () => {
        try {
            if (editedContent.trim() !== commentContent) {
                await onEdit(commentId, editedContent.trim());
            }
            setIsEditing(false);
        } catch {
            // The parent renders the user-facing error and keeps the editor open.
        }
    };

    const handleDelete = async () => {
        // open modal to collect optional reason
        setShowDropdown(false);
        setDeleteModalOpen(true);
    };

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);

    const performDelete = async ({ reason, notificationType }) => {
        setDeleteModalOpen(false);
        try {
            await onDelete(commentId, reason, notificationType);
            setShowDropdown(false);
        } catch {
            // parent will render error
        }
    };

    const toggleDropdown = (e) => {
        e.stopPropagation();
        if (isSaving || isDeleting) return;
        setShowDropdown(!showDropdown);
    };

    return (
        <>
        <article className="rounded-ami border border-border bg-white p-4 transition-[border-color,box-shadow,transform] duration-200 ease-out hover:-translate-y-px hover:border-accent/40 hover:shadow-[0_4px_18px_rgb(15_23_42/0.06)] focus-within:border-accent/50 motion-reduce:hover:translate-y-0 sm:p-5">
            <header className="flex items-start gap-3">
                <img
                    className="size-11 shrink-0 rounded-full border-2 border-white object-cover"
                    src={authorAvatar}
                    alt="аватар коментатора"
                />

                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="font-sans text-base/6 font-black text-ink">{author}</span>
                        <span className="text-sm/6 font-extrabold text-muted">{creationDate}</span>
                    </div>

                    <div className="mt-3">
                        {isEditing ? (
                            <div className="grid gap-3">
                                <textarea
                                    className="min-h-28 w-full resize-y rounded-ami border border-border bg-surface px-4 py-3 text-base/7 font-bold text-ink transition duration-200 placeholder:text-muted focus:border-accent focus:ring-4 focus:ring-accent/15"
                                    value={editedContent}
                                    onChange={(e) => setEditedContent(e.target.value)}
                                    autoFocus
                                />
                                <div className="flex flex-wrap gap-3">
                                    <button
                                        type="button"
                                        className="inline-flex min-h-11 items-center gap-2 rounded-ami border border-accent bg-accent px-5 text-sm/6 font-black text-white transition-[background-color,border-color,transform] duration-200 ease-out hover:border-accent-strong hover:bg-accent-strong active:translate-y-px focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-(--color-focus) disabled:cursor-not-allowed disabled:opacity-55 motion-reduce:active:translate-y-0"
                                        onClick={handleEditSubmit}
                                        disabled={isSaving || isDeleting || !editedContent.trim() || editedContent.trim() === commentContent}
                                    >
                                        {isSaving && (
                                            <span className="inline-block size-4 animate-spin rounded-full border-2 border-white border-t-transparent" aria-hidden="true" />
                                        )}
                                        {isSaving ? 'Зберігаємо…' : 'Зберегти'}
                                    </button>
                                    <button
                                        type="button"
                                        className="min-h-11 rounded-ami border border-border bg-transparent px-5 text-sm/6 font-black text-ink transition-[background-color,border-color,color,transform] duration-200 ease-out hover:border-border-strong hover:bg-soft active:translate-y-px focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-(--color-focus) disabled:cursor-not-allowed disabled:opacity-55 motion-reduce:active:translate-y-0"
                                        onClick={() => {
                                            setIsEditing(false);
                                            setEditedContent(commentContent);
                                        }}
                                        disabled={isSaving || isDeleting}
                                    >
                                        Скасувати
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <p className="m-0 whitespace-pre-wrap text-base/8 font-bold text-text">{commentContent}</p>
                        )}
                    </div>
                </div>

                {(isOwnComment || user?.role === 'ROLE_ADMIN') && (
                    <div className="relative shrink-0" ref={dropdownRef}>
                        <button
                            type="button"
                            className={cn(
                                "grid size-10 place-items-center rounded-ami border border-transparent bg-transparent text-muted transition duration-200 hover:border-accent/30 hover:bg-accent hover:text-white focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-(--color-focus) disabled:cursor-not-allowed disabled:opacity-60",
                                showDropdown && "border-accent/30 bg-accent text-white"
                            )}
                            onClick={toggleDropdown}
                            aria-haspopup="menu"
                            aria-expanded={showDropdown}
                            aria-label="Дії з коментарем"
                            disabled={isSaving || isDeleting}
                        >
                            <svg className="size-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
                                <path d="M12 13C12.5523 13 13 12.5523 13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12C11 12.5523 11.4477 13 12 13Z" fill="currentColor"/>
                                <path d="M12 6C12.5523 6 13 5.55228 13 5C13 4.44772 12.5523 4 12 4C11.4477 4 11 4.44772 11 5C11 5.55228 11.4477 6 12 6Z" fill="currentColor"/>
                                <path d="M12 20C12.5523 20 13 19.5523 13 19C13 18.4477 12.5523 18 12 18C11.4477 18 11 18.4477 11 19C11 19.5523 11.4477 20 12 20Z" fill="currentColor"/>
                            </svg>
                        </button>

                        {showDropdown && (
                            <div role="menu" className="ami-elevated ami-popover-motion absolute right-0 top-full z-20 mt-2 min-w-44 overflow-hidden rounded-ami border border-border bg-white">
                                {isOwnComment && (
                                    <button
                                        type="button"
                                        role="menuitem"
                                        onClick={() => {
                                            setShowDropdown(false);
                                            setIsEditing(true);
                                        }}
                                        className="inline-flex min-h-11 w-full items-center gap-2 border-0 bg-transparent px-4 text-left text-sm/6 font-black text-ink transition duration-200 hover:bg-soft hover:text-accent focus-visible:bg-soft focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-55"
                                        disabled={isSaving || isDeleting}
                                    >
                                        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                            <path d="M12 20h9" />
                                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
                                        </svg>
                                        Редагувати
                                    </button>
                                )}
                                <button
                                    type="button"
                                    role="menuitem"
                                    onClick={handleDelete}
                                    className="inline-flex min-h-11 w-full items-center gap-2 border-0 bg-transparent px-4 text-left text-sm/6 font-black text-red-700 transition duration-200 hover:bg-red-50 focus-visible:bg-red-50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-55"
                                    disabled={isSaving || isDeleting}
                                >
                                    {isDeleting ? (
                                        <span className="inline-block size-4 animate-spin rounded-full border-2 border-red-700 border-t-transparent" aria-hidden="true" />
                                    ) : (
                                        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6" />
                                        </svg>
                                    )}
                                    {isDeleting ? 'Видаляємо…' : 'Видалити'}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </header>
        </article>
        <DeleteConfirmation
            open={deleteModalOpen}
            title="Підтвердження видалення"
            message="Вкажіть обов'язкову причину видалення та виберіть тип сповіщення для користувача."
            onCancel={() => setDeleteModalOpen(false)}
            onConfirm={(payload) => performDelete(payload)}
        />
        </>
    );
}

Comment.propTypes = {
    commentId: PropsTypes.number.isRequired,
    authorAvatar: PropsTypes.string.isRequired,
    author: PropsTypes.string.isRequired,
    creationDate: PropsTypes.string.isRequired,
    commentContent: PropsTypes.string.isRequired,
    isOwnComment: PropsTypes.bool,
    isSaving: PropsTypes.bool,
    isDeleting: PropsTypes.bool,
    onEdit: PropsTypes.func,
    onDelete: PropsTypes.func
};

export default Comment;
