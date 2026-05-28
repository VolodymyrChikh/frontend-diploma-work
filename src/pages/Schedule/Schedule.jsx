import { useContext, useEffect, useMemo, useState } from 'react';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import StatusMessage from '../../components/StatusMessage/StatusMessage';
import { apiFetch } from '../../api/client';
import { createStatus, getErrorMessage } from '../../utils/messages.js';
import { AmiButton, AmiContainer, AmiPanel } from '../../ui/ami.jsx';
import { cn } from '../../ui/cn.js';
import { AuthContext } from '../../context/auth-context.js';

const WEEK_TYPE_LABELS = {
	ALL: 'Щотижня',
	NUMERATOR: 'Чисельник',
	DENOMINATOR: 'Знаменник',
};

const WEEK_FILTER_OPTIONS = ['NUMERATOR', 'DENOMINATOR'];

const WEEK_TYPE_BADGE = {
	ALL: 'bg-slate-100 text-slate-700 border-slate-200',
	NUMERATOR: 'bg-emerald-50 text-emerald-800 border-emerald-200',
	DENOMINATOR: 'bg-amber-50 text-amber-800 border-amber-200',
};

const LESSON_TYPE_LABELS = {
	LECTURE: 'Лекція',
	LAB: 'Лабораторна',
	PRACTICAL: 'Практика',
};

const LESSON_TYPE_BADGE = {
	LECTURE: 'bg-sky-50 text-sky-800 border-sky-200',
	LAB: 'bg-purple-50 text-purple-800 border-purple-200',
	PRACTICAL: 'bg-orange-50 text-orange-800 border-orange-200',
};

const DAY_ORDER = ['Понеділок', 'Вівторок', 'Середа', 'Четвер', "П'ятниця", 'Субота', 'Неділя'];

function normalizeGroupName(value) {
	return String(value || '').trim();
}

function formatTimeRange(entry) {
	if (entry.timeStart && entry.timeEnd) {
		return `${entry.timeStart} - ${entry.timeEnd}`;
	}
	return 'Час не вказано';
}

function timeToMinutes(timeValue) {
	if (!timeValue) {
		return Number.POSITIVE_INFINITY;
	}

	const [hours, minutes] = String(timeValue).split(':').map((part) => Number(part));
	if (Number.isNaN(hours) || Number.isNaN(minutes)) {
		return Number.POSITIVE_INFINITY;
	}

	return hours * 60 + minutes;
}

function Schedule() {
	const { user } = useContext(AuthContext);
	const [selectedFile, setSelectedFile] = useState(null);
	const [fileName, setFileName] = useState('Файл не вибрано');
	const [isParsing, setIsParsing] = useState(false);
	const [isLoadingSchedule, setIsLoadingSchedule] = useState(true);
	const [status, setStatus] = useState(null);
	const [scheduleDocs, setScheduleDocs] = useState([]);
	const [lessons, setLessons] = useState([]);
	const [allGroups, setAllGroups] = useState([]);
	const [deleteTarget, setDeleteTarget] = useState(null);
	const [isDeletingSchedule, setIsDeletingSchedule] = useState(false);
	const [selectedGroup, setSelectedGroup] = useState('');
	const [weekFilter, setWeekFilter] = useState('NUMERATOR');
	const [editTarget, setEditTarget] = useState(null);
	const [isEditingLesson, setIsEditingLesson] = useState(false);
	const [deleteLessonTarget, setDeleteLessonTarget] = useState(null);
	const [isDeletingLessonTarget, setIsDeletingLessonTarget] = useState(false);

	const isAdmin = user?.role === 'ROLE_ADMIN';

	const loadLatestSchedule = async () => {
		setIsLoadingSchedule(true);
		setStatus(null);
		try {
			const response = await apiFetch('/api/schedule/latest', {
				method: 'GET',
				skipAuth: true,
			});

			if (response.status === 404) {
				setScheduleDocs([]);
				setStatus(createStatus('info', 'Розклад ще не завантажено.'));
				return;
			}

			if (!response.ok) {
				const errorText = await response.text().catch(() => '');
				throw new Error(errorText || `Помилка завантаження: ${response.status}`);
			}

			const data = await response.json();
			setScheduleDocs(Array.isArray(data) ? data : [data]);

			const groupsResponse = await apiFetch('/api/lessons/groups', { method: 'GET', skipAuth: true });
			if (groupsResponse.ok) {
				const groupsData = await groupsResponse.json();
				setAllGroups(groupsData);
			}

			setStatus(null);
		} catch (error) {
			setStatus(createStatus('error', getErrorMessage(error, 'Не вдалося отримати розклад.')));
		} finally {
			setIsLoadingSchedule(false);
		}
	};

	useEffect(() => {
		loadLatestSchedule();
	}, []);

	useEffect(() => {
		if (selectedGroup) {
			const fetchLessons = async () => {
				try {
					const res = await apiFetch(`/api/lessons?groupName=${encodeURIComponent(selectedGroup)}`, { method: 'GET', skipAuth: true });
					if (res.ok) {
						setLessons(await res.json());
					} else {
						setLessons([]);
					}
				} catch (e) {
					console.error('Failed to fetch lessons', e);
					setLessons([]);
				}
			};
			fetchLessons();
		} else {
			setLessons([]);
		}
	}, [selectedGroup]);

	useEffect(() => {
		if (!allGroups.length) {
			return;
		}

		if (!selectedGroup || !allGroups.includes(selectedGroup)) {
			setSelectedGroup(allGroups[0]);
		}
	}, [allGroups, selectedGroup]);

	const handleFileChange = (event) => {
		const file = event.target.files?.[0] ?? null;
		setSelectedFile(file);
		setStatus(null);
		if (file) {
			setFileName(file.name);
		} else {
			setFileName('Файл не вибрано');
		}
	};

	const handleParse = async () => {
		if (!isAdmin) {
			setStatus(createStatus('warning', 'Завантаження розкладу доступне лише адміну.'));
			return;
		}

		if (!selectedFile) {
			setStatus(createStatus('error', 'Оберіть PDF-файл з розкладом.'));
			return;
		}

		setIsParsing(true);
		setStatus(null);

		try {
			const formData = new FormData();
			formData.append('file', selectedFile);

			const response = await apiFetch('/api/schedule/upload', {
				method: 'POST',
				body: formData,
			});

			if (!response.ok) {
				const errorText = await response.text().catch(() => '');
				throw new Error(errorText || `Помилка завантаження: ${response.status}`);
			}

			const data = await response.json();
			setScheduleDocs(Array.isArray(data) ? data : [data]);
			setSelectedFile(null);
			setFileName('Файл не вибрано');
			// Clear file input
			const fileInput = document.getElementById('scheduleFileInput');
			if (fileInput) fileInput.value = '';

			// Refresh groups
			const groupsResponse = await apiFetch('/api/lessons/groups', { method: 'GET', skipAuth: true });
			if (groupsResponse.ok) {
				setAllGroups(await groupsResponse.json());
				if (selectedGroup) {
					// Trigger refetch of current group lessons just in case
					setSelectedGroup('');
					setTimeout(() => setSelectedGroup(selectedGroup), 0);
				}
			}

			setStatus(createStatus('success', 'Розклад успішно додано.'));
		} catch (error) {
			setStatus(createStatus('error', getErrorMessage(error, 'Не вдалося прочитати PDF.')));
		} finally {
			setIsParsing(false);
		}
	};

	const handleDeleteSchedule = async (sourceFile) => {
		setDeleteTarget(sourceFile);
	};

	const closeDeleteModal = () => {
		if (isDeletingSchedule) {
			return;
		}

		setDeleteTarget(null);
	};

	const closeEditModal = () => {
		if (isEditingLesson) {
			return;
		}
		setEditTarget(null);
	};

	const closeDeleteLessonModal = () => {
		if (isDeletingLessonTarget) return;
		setDeleteLessonTarget(null);
	};

	const submitEditLesson = async (event) => {
		event.preventDefault();
		if (!editTarget) return;

		setIsEditingLesson(true);
		try {
			const payload = {
				...editTarget,
				teachers: typeof editTarget.teachers === 'string' 
					? editTarget.teachers.split(',').map(t => t.trim()).filter(Boolean)
					: editTarget.teachers
			};

			if (editTarget.id) {
				const res = await apiFetch(`/api/lessons/${editTarget.id}`, {
					method: 'PUT',
					body: JSON.stringify(payload),
					headers: { 'Content-Type': 'application/json' }
				});

				if (!res.ok) {
					const err = await res.text().catch(() => '');
					throw new Error(err || 'Failed to update lesson');
				}

				const updatedLesson = await res.json();
				setLessons(lessons.map(l => l.id === updatedLesson.id ? updatedLesson : l));
				setStatus(createStatus('success', 'Пару успішно оновлено.'));
			} else {
				// Create new lesson
				const res = await apiFetch(`/api/lessons`, {
					method: 'POST',
					body: JSON.stringify(payload),
					headers: { 'Content-Type': 'application/json' }
				});

				if (!res.ok) {
					const err = await res.text().catch(() => '');
					throw new Error(err || 'Failed to create lesson');
				}

				const createdLesson = await res.json();
				setLessons([...lessons, createdLesson]);
				setStatus(createStatus('success', 'Пару успішно створено.'));
			}
			closeEditModal();
		} catch (error) {
			setStatus(createStatus('error', getErrorMessage(error, editTarget.id ? 'Не вдалося оновити пару.' : 'Не вдалося створити пару.')));
		} finally {
			setIsEditingLesson(false);
		}
	};

	const confirmDeleteLesson = async (event) => {
		event.preventDefault();
		if (!deleteLessonTarget) return;

		setIsDeletingLessonTarget(true);
		try {
			const res = await apiFetch(`/api/lessons/${deleteLessonTarget.id}`, {
				method: 'DELETE'
			});

			if (!res.ok) {
				const errorText = await res.text().catch(() => '');
				throw new Error(errorText || `Помилка видалення: ${res.status}`);
			}

			setLessons(lessons.filter(l => l.id !== deleteLessonTarget.id));
			setStatus(createStatus('info', 'Заняття успішно видалено.'));
			setDeleteLessonTarget(null);
		} catch (error) {
			setStatus(createStatus('error', getErrorMessage(error, 'Не вдалося видалити пару.')));
		} finally {
			setIsDeletingLessonTarget(false);
		}
	};

	const confirmDeleteSchedule = async (event) => {
		event.preventDefault();
		if (!deleteTarget) {
			return;
		}

		setIsDeletingSchedule(true);
		try {
			const response = await apiFetch(`/api/schedule/latest?sourceFile=${encodeURIComponent(deleteTarget)}`, {
				method: 'DELETE',
			});

			if (!response.ok) {
				const errorText = await response.text().catch(() => '');
				throw new Error(errorText || `Помилка видалення: ${response.status}`);
			}

			const data = await response.json();
			setScheduleDocs(Array.isArray(data) ? data : []);
			setStatus(createStatus('info', 'Розклад успішно видалено.'));
			setDeleteTarget(null);

			// Refresh groups
			const groupsResponse = await apiFetch('/api/lessons/groups', { method: 'GET', skipAuth: true });
			if (groupsResponse.ok) {
				const groupsData = await groupsResponse.json();
				setAllGroups(groupsData);
				if (!groupsData.includes(selectedGroup)) {
					setSelectedGroup(groupsData[0] || '');
				} else {
					setSelectedGroup('');
					setTimeout(() => setSelectedGroup(selectedGroup), 0);
				}
			} else {
				setAllGroups([]);
				setSelectedGroup('');
			}
		} catch (error) {
			setStatus(createStatus('error', getErrorMessage(error, 'Не вдалося видалити розклад.')));
		} finally {
			setIsDeletingSchedule(false);
		}
	};

	const availableGroups = allGroups;

	const filteredEntries = useMemo(() => {
		if (!lessons.length || !selectedGroup) {
			return [];
		}

		let combinedEntries = [...lessons];

		return combinedEntries
			.filter((entry) => entry.weekType === weekFilter || entry.weekType === 'ALL')
			.sort((a, b) => {
				const dayIndexA = DAY_ORDER.indexOf(a.dayOfWeek);
				const dayIndexB = DAY_ORDER.indexOf(b.dayOfWeek);
				if (dayIndexA !== dayIndexB) {
					return (dayIndexA === -1 ? 99 : dayIndexA) - (dayIndexB === -1 ? 99 : dayIndexB);
				}

				const timeStartA = timeToMinutes(a.timeStart);
				const timeStartB = timeToMinutes(b.timeStart);
				if (timeStartA !== timeStartB) {
					return timeStartA - timeStartB;
				}

				if (a.pairNumber !== b.pairNumber) {
					return (a.pairNumber || 0) - (b.pairNumber || 0);
				}

				const timeEndA = timeToMinutes(a.timeEnd);
				const timeEndB = timeToMinutes(b.timeEnd);
				if (timeEndA !== timeEndB) {
					return timeEndA - timeEndB;
				}

				return String(a.subjectName || '').localeCompare(String(b.subjectName || ''));
			});
	}, [lessons, selectedGroup, weekFilter]);

	const entriesByDay = useMemo(() => {
		const map = new Map();
		filteredEntries.forEach((entry) => {
			const key = entry.dayOfWeek || 'Без дня';
			if (!map.has(key)) {
				map.set(key, []);
			}
			map.get(key).push(entry);
		});

		return Array.from(map.entries()).sort(([dayA], [dayB]) => {
			const indexA = DAY_ORDER.indexOf(dayA);
			const indexB = DAY_ORDER.indexOf(dayB);
			return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
		});
	}, [filteredEntries]);

	return (
		<div className="min-h-dvh bg-page text-ink">
			<Header />

			<section className="border-b border-border bg-linear-to-b from-accent-soft/60 to-transparent">
				<AmiContainer className="grid gap-8 py-10 md:py-14 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
					<div className="grid min-w-0 gap-4">
						<h1 className="m-0 font-sans text-[clamp(2rem,4.5vw,3.25rem)]/[1.05] font-black text-ink">
							Розклад занять
						</h1>
						<p className="m-0 max-w-2xl text-base/7 font-bold text-muted md:text-lg/8">
							Завантаж PDF-розклад, обери групу та тиждень — і отримай зручну структуру пар у кілька кліків.
						</p>
					</div>
				</AmiContainer>
			</section>

			<AmiContainer className="grid gap-6 py-8 lg:gap-8 lg:py-10">
				{isAdmin ? (
					<AmiPanel className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
						<div className="grid gap-2">
							<span className="font-sans text-xs/5 font-black uppercase tracking-wide text-muted">PDF розклад</span>
							<div className="flex flex-wrap items-center gap-3">
								<label className="inline-flex min-h-12 items-center gap-3 rounded-ami border border-border bg-white px-4 text-sm/6 font-extrabold text-muted">
									<input
										id="scheduleFileInput"
										type="file"
										accept="application/pdf"
										onChange={handleFileChange}
										className="hidden"
									/>
									<span className="grid size-9 place-items-center rounded-full bg-accent-soft text-accent" aria-hidden="true">
										<svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
											<path d="M12 3v12" />
											<path d="m7 10 5 5 5-5" />
											<path d="M5 21h14" />
										</svg>
									</span>
									<span className="min-w-0 truncate">{fileName}</span>
								</label>
								<AmiButton
									type="button"
									onClick={handleParse}
									loading={isParsing}
									className="min-w-36"
								>
									{isParsing ? 'Парсимо' : 'Зчитати'}
								</AmiButton>
							</div>
							<p className="m-0 text-sm/6 font-bold text-muted">
								Підтримуються розклади в форматі таблиці. Файл зберігається в сховищі для перегляду.
							</p>
						</div>

						{scheduleDocs && scheduleDocs.length > 0 ? (
							<div className="grid gap-3 rounded-ami border border-border bg-soft px-5 py-4 text-sm/6 font-extrabold text-ink max-h-64 overflow-y-auto">
								<div className="flex justify-between items-start gap-4 pb-2 border-b border-border">
									<span className="text-xs/5 font-black uppercase tracking-wide text-muted">Завантажені файли ({scheduleDocs.length})</span>
								</div>
								{scheduleDocs.map((doc, idx) => (
									<div key={idx} className="flex flex-col gap-1 border-t border-border pt-2 mt-2 first:border-0 first:pt-0 first:mt-0">
										<div className="flex justify-between items-center gap-2">
											<span className="truncate font-bold">{doc.source_file || '—'}</span>
											<button
												type="button"
												onClick={() => handleDeleteSchedule(doc.source_file)}
												className="text-red-500 hover:text-red-700 transition shrink-0"
												title="Видалити цей розклад"
											>
												<svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
													<path d="M3 6h18" />
													<path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
													<path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
												</svg>
											</button>
										</div>
										<span className="text-xs text-muted">Семестр: {doc.semester || '—'} | Рік: {doc.academic_year || '—'}</span>
									</div>
								))}
							</div>
						) : null}
					</AmiPanel>
				) : null}

				{status?.message ? (
					<StatusMessage type={status.type} message={status.message} onDismiss={() => setStatus(null)} />
				) : null}

				<AmiPanel className="grid gap-5 p-5 sm:p-6">
					<div className="flex flex-wrap gap-4 items-end justify-between">
						<div className="flex flex-wrap gap-4 items-end w-full lg:w-auto flex-1">
							<div className="grid gap-2 flex-1 min-w-[200px]">
								<label htmlFor="groupSelect" className="font-sans text-xs/5 font-black uppercase tracking-wide text-muted">
									Група
								</label>
								<select
									id="groupSelect"
									value={selectedGroup}
									onChange={(event) => setSelectedGroup(event.target.value)}
									className="min-h-12 w-full rounded-ami border border-border bg-white px-4 text-sm/6 font-extrabold text-ink outline-hidden transition focus:border-accent focus:ring-4 focus:ring-accent/15"
								>
									{!availableGroups.length ? (
										<option value="">Завантажте розклад</option>
									) : null}
									{availableGroups.map((group) => (
										<option key={group} value={group}>{group}</option>
									))}
								</select>
							</div>

							<div className="grid gap-2 flex-1 min-w-[200px]">
								<span className="font-sans text-xs/5 font-black uppercase tracking-wide text-muted">Тиждень</span>
								<div className="inline-flex w-full rounded-ami border border-border bg-soft p-1">
									{WEEK_FILTER_OPTIONS.map((type) => {
										const isActive = weekFilter === type;
										return (
											<button
												key={type}
												type="button"
												onClick={() => setWeekFilter(type)}
												className={cn(
													'min-h-10 flex-1 rounded-lg px-4 text-xs/5 font-extrabold transition-[background-color,color,box-shadow] duration-200 ease-out focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-(--color-focus)',
													isActive ? 'bg-white text-ink shadow-[0_1px_2px_rgb(15_23_42/0.08)]' : 'text-muted hover:text-ink',
												)}
											>
												{WEEK_TYPE_LABELS[type]}
											</button>
										);
									})}
								</div>
							</div>
						</div>

						{isAdmin && selectedGroup && (
							<div className="shrink-0 w-full lg:w-auto">
								<AmiButton
									type="button"
									onClick={() => setEditTarget({
										groupName: selectedGroup,
										subjectName: '',
										lessonType: '',
										weekType: 'ALL',
										dayOfWeek: 'Понеділок',
										pairNumber: 1,
										room: '',
										timeStart: '',
										timeEnd: '',
										teachers: ''
									})}
									className="w-full lg:w-auto"
								>
									<svg viewBox="0 0 24 24" className="mr-2 size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
										<path d="M12 5v14" />
										<path d="M5 12h14" />
									</svg>
									Додати пару
								</AmiButton>
							</div>
						)}
					</div>

					{!scheduleDocs.length && !isLoadingSchedule ? (
						<div className="grid place-items-center gap-3 rounded-ami border border-dashed border-border bg-white/80 px-6 py-10 text-center">
							<span className="grid size-12 place-items-center rounded-full bg-accent-soft text-accent" aria-hidden="true">
								<svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
									<path d="M21 15a4 4 0 0 1-4 4H7a4 4 0 0 1 0-8 5 5 0 0 1 9-2 4 4 0 0 1 5 6Z" />
								</svg>
							</span>
							<h3 className="m-0 font-sans text-lg/7 font-black text-ink">
								{isAdmin ? 'Додайте PDF розклад' : 'Розклад ще не опубліковано'}
							</h3>
							<p className="m-0 max-w-md text-sm/6 font-bold text-muted">
								{isAdmin
									? 'Після завантаження можна буде перемикатись між групами та тижнями.'
									: 'Очікуйте, поки адміністратор завантажить актуальний розклад.'}
							</p>
						</div>
					) : null}

					{scheduleDocs.length > 0 && !selectedGroup ? (
						<div className="grid place-items-center gap-3 rounded-ami border border-dashed border-border bg-white/80 px-6 py-10 text-center">
							<h3 className="m-0 font-sans text-lg/7 font-black text-ink">Оберіть групу</h3>
							<p className="m-0 max-w-md text-sm/6 font-bold text-muted">Після вибору групи з'явиться розклад пар.</p>
						</div>
					) : null}

					{scheduleDocs.length > 0 && selectedGroup && filteredEntries.length === 0 ? (
						<div className="grid place-items-center gap-3 rounded-ami border border-dashed border-border bg-white/80 px-6 py-10 text-center">
							<h3 className="m-0 font-sans text-lg/7 font-black text-ink">Немає пар для вибраного тижня</h3>
							<p className="m-0 max-w-md text-sm/6 font-bold text-muted">Спробуйте змінити тиждень або перевірити інший PDF.</p>
						</div>
					) : null}

					{entriesByDay.map(([day, entries]) => (
						<div key={day} className="grid gap-4">
							<div className="flex flex-wrap items-center justify-between gap-3">
								<h2 className="m-0 font-sans text-xl/7 font-black text-ink">{day}</h2>
								<span className="text-xs/5 font-black uppercase tracking-wide text-muted">{entries.length} пар</span>
							</div>
							<div className="grid gap-3">
								{entries.map((entry, index) => (
									<AmiPanel key={`${entry.dayOfWeek}-${entry.pairNumber}-${index}`} className="grid gap-3 px-5 py-4">
										<div className="flex flex-wrap items-center gap-2 text-sm/6 font-extrabold text-ink">
											<span className="inline-flex items-center gap-2 rounded-ami border border-border bg-white px-3 py-1">
												<span className="text-xs/5 font-black uppercase tracking-wide text-muted">Пара {entry.pairLabel || entry.pairNumber}</span>
												<span className="text-ink">{formatTimeRange(entry)}</span>
											</span>
											{entry.lessonType ? (
												<span className={cn('inline-flex items-center rounded-ami border px-3 py-1 text-xs/5 font-black uppercase tracking-wide', LESSON_TYPE_BADGE[entry.lessonType] || 'border-border bg-white text-ink')}>
													{LESSON_TYPE_LABELS[entry.lessonType] || entry.lessonType}
												</span>
											) : null}
											{entry.weekType === 'ALL' ? (
												<span className={cn('inline-flex items-center rounded-ami border px-3 py-1 text-xs/5 font-black uppercase tracking-wide', WEEK_TYPE_BADGE[entry.weekType] || 'border-border bg-white text-ink')}>
													{WEEK_TYPE_LABELS[entry.weekType] || entry.weekType}
												</span>
											) : null}
										</div>
										<div className="grid gap-2 text-sm/6 font-bold text-muted">
											<strong className="text-base/7 font-black text-ink">{entry.subjectName || 'Назва не вказана'}</strong>
											<div className="flex flex-wrap gap-3">
												{entry.room ? (
													<span className="inline-flex items-center gap-2 rounded-ami border border-border bg-soft px-3 py-1 text-xs/5 font-black uppercase tracking-wide text-muted">
														Ауд. {entry.room}
													</span>
												) : null}
												{Array.isArray(entry.teachers) && entry.teachers.length ? (
													<span className="inline-flex flex-wrap items-center gap-2 rounded-ami border border-border bg-soft px-3 py-1 text-xs/5 font-black uppercase tracking-wide text-muted">
														Викладачі: {entry.teachers.join(', ')}
													</span>
												) : null}
											</div>
											{entry.rawText ? (
												<p className="m-0 text-sm/6 font-bold text-muted">{entry.rawText}</p>
											) : null}
										</div>
										{isAdmin && (
											<div className="mt-2 flex justify-end gap-3 border-t border-border pt-3">
												<button
													type="button"
													onClick={() => setDeleteLessonTarget(entry)}
													className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 transition px-2 py-1 bg-red-50 hover:bg-red-100 rounded"
												>
													<svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
														<path d="M3 6h18" />
														<path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
														<path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
													</svg>
													Видалити
												</button>
												<button
													type="button"
													onClick={() => setEditTarget({
														...entry,
														teachers: Array.isArray(entry.teachers) ? entry.teachers.join(', ') : entry.teachers || ''
													})}
													className="inline-flex items-center gap-1.5 text-xs font-bold text-accent hover:text-accent-dark transition px-2 py-1 bg-accent-soft hover:bg-accent-soft/80 rounded"
												>
													<svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
														<path d="M12 20h9" />
														<path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
													</svg>
													Редагувати
												</button>
											</div>
										)}
									</AmiPanel>
								))}
							</div>
						</div>
					))}
				</AmiPanel>
			</AmiContainer>

			{deleteTarget ? (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]">
					<form
						onSubmit={confirmDeleteSchedule}
						className="w-full max-w-xl rounded-ami border border-border bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.22)]"
					>
						<div className="grid gap-2">
							<span className="font-sans text-xs/5 font-black uppercase tracking-wide text-red-600">Підтвердження видалення</span>
							<h3 className="m-0 font-sans text-2xl/8 font-black text-ink">Видалити розклад?</h3>
							<p className="m-0 text-sm/6 font-bold text-muted">
								Файл <strong className="text-ink">{deleteTarget}</strong> буде видалено.
							</p>
						</div>

						<div className="mt-5 grid gap-2">
							<p className="m-0 text-sm/6 font-bold text-muted">
								Підтвердіть дію, якщо хочете остаточно видалити цей розклад.
							</p>
						</div>

						<div className="mt-6 flex flex-wrap justify-end gap-3">
							<button
								type="button"
								onClick={closeDeleteModal}
								disabled={isDeletingSchedule}
								className="inline-flex min-h-11 items-center gap-2 rounded-ami border border-border bg-white px-4 text-sm/6 font-black text-ink transition hover:bg-soft disabled:cursor-not-allowed disabled:opacity-60"
							>
								Скасувати
							</button>
							<AmiButton type="submit" loading={isDeletingSchedule}>
								Видалити
							</AmiButton>
						</div>
					</form>
				</div>
			) : null}

			{deleteLessonTarget ? (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]">
					<form
						onSubmit={confirmDeleteLesson}
						className="w-full max-w-xl rounded-ami border border-border bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.22)]"
					>
						<div className="grid gap-2">
							<span className="font-sans text-xs/5 font-black uppercase tracking-wide text-red-600">Підтвердження видалення</span>
							<h3 className="m-0 font-sans text-2xl/8 font-black text-ink">Видалити заняття?</h3>
							<p className="m-0 text-sm/6 font-bold text-muted">
								Заняття <strong className="text-ink">{deleteLessonTarget.subjectName} ({deleteLessonTarget.dayOfWeek}, пара {deleteLessonTarget.pairNumber})</strong> буде видалено для групи <strong className="text-ink">{selectedGroup}</strong>.
							</p>
						</div>

						<div className="mt-5 grid gap-2">
							<p className="m-0 text-sm/6 font-bold text-muted">
								Ви впевнені? Ця дія незворотна.
							</p>
						</div>

						<div className="mt-6 flex flex-wrap justify-end gap-3">
							<button
								type="button"
								onClick={closeDeleteLessonModal}
								disabled={isDeletingLessonTarget}
								className="inline-flex min-h-11 items-center gap-2 rounded-ami border border-border bg-white px-4 text-sm/6 font-black text-ink transition hover:bg-soft disabled:cursor-not-allowed disabled:opacity-60"
							>
								Скасувати
							</button>
							<button
								type="submit"
								disabled={isDeletingLessonTarget}
								className="inline-flex min-h-11 items-center justify-center gap-2 rounded-ami border border-transparent bg-red-600 px-6 text-sm/6 font-black text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
							>
								{isDeletingLessonTarget ? 'Видалення...' : 'Видалити'}
							</button>
						</div>
					</form>
				</div>
			) : null}

			{editTarget ? (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]">
					<form
						onSubmit={submitEditLesson}
						className="flex flex-col w-full max-w-xl max-h-[90vh] rounded-ami border border-border bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.22)]"
					>
						<div className="grid gap-2 shrink-0">
							<h3 className="m-0 font-sans text-2xl/8 font-black text-ink">
								{editTarget.id ? 'Редагувати заняття' : 'Додати нове заняття'}
							</h3>
						</div>

						<div className="mt-5 grid gap-4 overflow-y-auto pr-2 custom-scrollbar">
							<div className="grid gap-2">
								<label className="text-sm font-bold text-muted">Предмет</label>
								<input
									type="text"
									required
									value={editTarget.subjectName || ''}
									onChange={(e) => setEditTarget({ ...editTarget, subjectName: e.target.value })}
									className="rounded border border-border px-3 py-2 text-sm text-ink w-full"
								/>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div className="grid gap-2">
									<label className="text-sm font-bold text-muted">Тип заняття</label>
									<select
										value={editTarget.lessonType || ''}
										onChange={(e) => setEditTarget({ ...editTarget, lessonType: e.target.value })}
										className="rounded border border-border px-3 py-2 text-sm text-ink w-full"
									>
										<option value="">Не вказано</option>
										<option value="LECTURE">Лекція</option>
										<option value="LAB">Лабораторна</option>
										<option value="PRACTICAL">Практика</option>
									</select>
								</div>
								<div className="grid gap-2">
									<label className="text-sm font-bold text-muted">Тиждень</label>
									<select
										value={editTarget.weekType || 'ALL'}
										onChange={(e) => setEditTarget({ ...editTarget, weekType: e.target.value })}
										className="rounded border border-border px-3 py-2 text-sm text-ink w-full"
									>
										<option value="ALL">Щотижня</option>
										<option value="NUMERATOR">Чисельник</option>
										<option value="DENOMINATOR">Знаменник</option>
									</select>
								</div>
							</div>
							<div className="grid grid-cols-3 gap-4">
								<div className="grid gap-2">
									<label className="text-sm font-bold text-muted">День</label>
									<select
										value={editTarget.dayOfWeek || 'Понеділок'}
										onChange={(e) => setEditTarget({ ...editTarget, dayOfWeek: e.target.value })}
										className="rounded border border-border px-3 py-2 text-sm text-ink w-full"
									>
										{DAY_ORDER.map(day => (
											<option key={day} value={day}>{day}</option>
										))}
									</select>
								</div>
								<div className="grid gap-2">
									<label className="text-sm font-bold text-muted">Пара</label>
									<input
										type="number"
										value={editTarget.pairNumber || ''}
										onChange={(e) => setEditTarget({ ...editTarget, pairNumber: e.target.value ? Number(e.target.value) : null })}
										className="rounded border border-border px-3 py-2 text-sm text-ink w-full"
									/>
								</div>
								<div className="grid gap-2">
									<label className="text-sm font-bold text-muted">Аудиторія</label>
									<input
										type="text"
										value={editTarget.room || ''}
										onChange={(e) => setEditTarget({ ...editTarget, room: e.target.value })}
										className="rounded border border-border px-3 py-2 text-sm text-ink w-full"
									/>
								</div>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div className="grid gap-2">
									<label className="text-sm font-bold text-muted">Час початку</label>
									<input
										type="text"
										placeholder="13:30"
										value={editTarget.timeStart || ''}
										onChange={(e) => setEditTarget({ ...editTarget, timeStart: e.target.value })}
										className="rounded border border-border px-3 py-2 text-sm text-ink w-full"
									/>
								</div>
								<div className="grid gap-2">
									<label className="text-sm font-bold text-muted">Час кінця</label>
									<input
										type="text"
										placeholder="14:50"
										value={editTarget.timeEnd || ''}
										onChange={(e) => setEditTarget({ ...editTarget, timeEnd: e.target.value })}
										className="rounded border border-border px-3 py-2 text-sm text-ink w-full"
									/>
								</div>
							</div>
							<div className="grid gap-2">
								<label className="text-sm font-bold text-muted">Викладачі (через кому)</label>
								<input
									type="text"
									value={editTarget.teachers || ''}
									onChange={(e) => setEditTarget({ ...editTarget, teachers: e.target.value })}
									className="rounded border border-border px-3 py-2 text-sm text-ink w-full"
								/>
							</div>
							{editTarget.rawText ? (
								<div className="grid gap-2 p-3 bg-soft rounded border border-border text-xs text-muted">
									<strong>Оригінальний текст з PDF:</strong>
									<span>{editTarget.rawText}</span>
								</div>
							) : null}
						</div>

						<div className="mt-6 flex flex-wrap justify-end gap-3 shrink-0">
							<button
								type="button"
								onClick={closeEditModal}
								disabled={isEditingLesson}
								className="inline-flex min-h-11 items-center gap-2 rounded-ami border border-border bg-white px-4 text-sm/6 font-black text-ink transition hover:bg-soft disabled:cursor-not-allowed disabled:opacity-60"
							>
								Скасувати
							</button>
							<AmiButton type="submit" loading={isEditingLesson}>
								Зберегти
							</AmiButton>
						</div>
					</form>
				</div>
			) : null}

			<Footer />
		</div>
	);
}

export default Schedule;
