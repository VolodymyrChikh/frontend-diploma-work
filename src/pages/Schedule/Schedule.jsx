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
	ALL: 'Усі тижні',
	NUMERATOR: 'Чисельник',
	DENOMINATOR: 'Знаменник',
};

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

const DAY_ORDER = ['Понеділок', 'Вівторок', 'Середа', 'Четвер', 'П’ятниця', 'Субота', 'Неділя'];

function normalizeGroupName(value) {
	return String(value || '').trim();
}

function formatTimeRange(entry) {
	if (entry.time_start && entry.time_end) {
		return `${entry.time_start} - ${entry.time_end}`;
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
	const [deleteTarget, setDeleteTarget] = useState(null);
	const [isDeletingSchedule, setIsDeletingSchedule] = useState(false);
	const [selectedGroup, setSelectedGroup] = useState('');
	const [weekFilter, setWeekFilter] = useState('ALL');

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

	const allGroups = useMemo(() => {
		const groups = new Set();
		scheduleDocs.forEach((doc) => {
			(doc.groups || []).forEach((g) => groups.add(normalizeGroupName(g)));
		});
		return Array.from(groups).filter(Boolean).sort();
	}, [scheduleDocs]);

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
		} catch (error) {
			setStatus(createStatus('error', getErrorMessage(error, 'Не вдалося видалити розклад.')));
		} finally {
			setIsDeletingSchedule(false);
		}
	};

	const availableGroups = allGroups;

	const filteredEntries = useMemo(() => {
		if (!scheduleDocs.length || !selectedGroup) {
			return [];
		}

		let combinedEntries = [];
		scheduleDocs.forEach((doc) => {
			if (doc.entries && Array.isArray(doc.entries)) {
				combinedEntries = combinedEntries.concat(doc.entries);
			}
		});

		return combinedEntries
			.filter((entry) => entry.groups?.includes(selectedGroup))
			.filter((entry) => weekFilter === 'ALL' || entry.week_type === weekFilter)
			.sort((a, b) => {
				const dayIndexA = DAY_ORDER.indexOf(a.day);
				const dayIndexB = DAY_ORDER.indexOf(b.day);
				if (dayIndexA !== dayIndexB) {
					return (dayIndexA === -1 ? 99 : dayIndexA) - (dayIndexB === -1 ? 99 : dayIndexB);
				}

				const timeStartA = timeToMinutes(a.time_start);
				const timeStartB = timeToMinutes(b.time_start);
				if (timeStartA !== timeStartB) {
					return timeStartA - timeStartB;
				}

				if (a.pair_number !== b.pair_number) {
					return (a.pair_number || 0) - (b.pair_number || 0);
				}

				const timeEndA = timeToMinutes(a.time_end);
				const timeEndB = timeToMinutes(b.time_end);
				if (timeEndA !== timeEndB) {
					return timeEndA - timeEndB;
				}

				return String(a.subject || '').localeCompare(String(b.subject || ''));
			});
	}, [scheduleDocs, selectedGroup, weekFilter]);

	const entriesByDay = useMemo(() => {
		const map = new Map();
		filteredEntries.forEach((entry) => {
			const key = entry.day || 'Без дня';
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
					<div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
						<div className="grid gap-2">
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

						<div className="grid gap-2">
							<span className="font-sans text-xs/5 font-black uppercase tracking-wide text-muted">Тиждень</span>
							<div className="inline-flex w-full rounded-ami border border-border bg-soft p-1">
								{Object.keys(WEEK_TYPE_LABELS).map((type) => {
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
									<AmiPanel key={`${entry.day}-${entry.pair_number}-${index}`} className="grid gap-3 px-5 py-4">
										<div className="flex flex-wrap items-center gap-2 text-sm/6 font-extrabold text-ink">
											<span className="inline-flex items-center gap-2 rounded-ami border border-border bg-white px-3 py-1">
												<span className="text-xs/5 font-black uppercase tracking-wide text-muted">Пара {entry.pair_label || entry.pair_number}</span>
												<span className="text-ink">{formatTimeRange(entry)}</span>
											</span>
											{entry.lesson_type ? (
												<span className={cn('inline-flex items-center rounded-ami border px-3 py-1 text-xs/5 font-black uppercase tracking-wide', LESSON_TYPE_BADGE[entry.lesson_type] || 'border-border bg-white text-ink')}>
													{LESSON_TYPE_LABELS[entry.lesson_type] || entry.lesson_type}
												</span>
											) : null}
											{weekFilter === 'ALL' ? (
												<span className={cn('inline-flex items-center rounded-ami border px-3 py-1 text-xs/5 font-black uppercase tracking-wide', WEEK_TYPE_BADGE[entry.week_type] || 'border-border bg-white text-ink')}>
													{WEEK_TYPE_LABELS[entry.week_type] || entry.week_type}
												</span>
											) : null}
										</div>
										<div className="grid gap-2 text-sm/6 font-bold text-muted">
											<strong className="text-base/7 font-black text-ink">{entry.subject || 'Назва не вказана'}</strong>
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
											{entry.raw_text ? (
												<p className="m-0 text-sm/6 font-bold text-muted">{entry.raw_text}</p>
											) : null}
										</div>
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

			<Footer />
		</div>
	);
}

export default Schedule;
