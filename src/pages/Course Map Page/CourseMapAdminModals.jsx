import { useState, useEffect } from 'react';
import { apiFetch } from '../../api/client';
import { AmiButton, AmiPanel } from '../../ui/ami.jsx';

const BLOCK_TYPES = [
    { value: 'HUMANITARIAN', label: 'Гуманітарний блок' },
    { value: 'SCIENTIFIC', label: 'Природничо-науковий блок' },
    { value: 'PROFESSIONAL', label: 'Фаховий блок' },
    { value: 'PDFC', label: 'Фахова дисципліна вільного вибору' }
];

const EXAM_TYPES = [
    { value: 'EXAM', label: 'Іспит' },
    { value: 'CREDIT', label: 'Залік' },
    { value: 'COURSEWORK', label: 'Курсова робота' },
    { value: 'DIPLOMA', label: 'Дипломна робота' },
    { value: 'MAGISTER', label: 'Магістерська робота' },
    { value: 'DIFFERENTIATED_CREDIT', label: 'Диф. залік' },
    { value: 'OTHER', label: 'Немає' }
];

const SELECTIVE_GROUP_ENDPOINTS = ['/selective-groups', '/api/v1/selective-groups'];

async function fetchSelectiveGroupEndpoint(pathSuffix = '', options = {}) {
    let lastResponse = null;

    for (const basePath of SELECTIVE_GROUP_ENDPOINTS) {
        const response = await apiFetch(`${basePath}${pathSuffix}`, options);
        lastResponse = response;

        if (response.status !== 404) {
            return response;
        }
    }

    return lastResponse;
}

export function SubjectModal({ isOpen, onClose, onSaved, initialData, specialties, selectiveGroups, selectedSpecialtyId, selectedSemester }) {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        credits: 3,
        taughtBy: '',
        semester: selectedSemester || 1,
        syllabusLink: '',
        specialtyId: selectedSpecialtyId || '',
        blockType: 'PROFESSIONAL',
        examType: 'EXAM',
        degreeLevel: 'BACHELOR',
        selectiveGroupId: ''
    });

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData({
                    ...initialData,
                    credits: initialData.credits || 0,
                    semester: initialData.semester || 1,
                    selectiveGroupId: initialData.selectiveGroupId || ''
                });
            } else {
                setFormData({
                    name: '',
                    description: '',
                    credits: 3,
                    taughtBy: '',
                    semester: selectedSemester || 1,
                    syllabusLink: '',
                    specialtyId: selectedSpecialtyId || (specialties[0]?.id || ''),
                    blockType: 'PROFESSIONAL',
                    examType: 'EXAM',
                    degreeLevel: 'BACHELOR',
                    selectiveGroupId: ''
                });
            }
        }
    }, [isOpen, initialData, selectedSpecialtyId, selectedSemester, specialties]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                selectiveGroupId: formData.selectiveGroupId ? Number(formData.selectiveGroupId) : null
            };
            
            const method = initialData ? 'PUT' : 'POST';
            const url = initialData ? `/subjects/${initialData.id}` : '/subjects';
            
            const response = await apiFetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error('Помилка при збереженні предмета');
            }

            const savedItem = await response.json();
            onSaved(savedItem, initialData ? 'update' : 'create');
            onClose();
        } catch (error) {
            alert(error.message);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <AmiPanel className="w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 bg-white">
                <h2 className="text-xl font-black mb-4">{initialData ? 'Редагувати предмет' : 'Додати предмет'}</h2>
                <form onSubmit={handleSubmit} className="grid gap-4">
                    <div>
                        <label className="block text-sm font-bold text-muted mb-1">Назва</label>
                        <input required type="text" className="w-full border rounded p-2" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-muted mb-1">Кредити</label>
                        <input required type="number" min="0" className="w-full border rounded p-2" value={formData.credits} onChange={e => setFormData({...formData, credits: Number(e.target.value)})} />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-muted mb-1">Семестр</label>
                        <input required type="number" min="1" className="w-full border rounded p-2" value={formData.semester} onChange={e => setFormData({...formData, semester: Number(e.target.value)})} />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-muted mb-1">Спеціальність</label>
                        <select required className="w-full border rounded p-2" value={formData.specialtyId} onChange={e => setFormData({...formData, specialtyId: Number(e.target.value)})}>
                            <option value="">Оберіть...</option>
                            {specialties
                                .filter(s => s.id !== 12)
                                .map(s => <option key={s.id} value={s.id}>{s.name}</option>)
                            }
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-muted mb-1">Блок</label>
                        <select required className="w-full border rounded p-2" value={formData.blockType} onChange={e => setFormData({...formData, blockType: e.target.value})}>
                            {BLOCK_TYPES.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-muted mb-1">Тип контролю</label>
                        <select required className="w-full border rounded p-2" value={formData.examType} onChange={e => setFormData({...formData, examType: e.target.value})}>
                            {EXAM_TYPES.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-muted mb-1">Група за вибором (необов'язково)</label>
                        <select className="w-full border rounded p-2" value={formData.selectiveGroupId} onChange={e => setFormData({...formData, selectiveGroupId: e.target.value})}>
                            <option value="">-- Не належить до групи --</option>
                            {selectiveGroups.map(sg => <option key={sg.id} value={sg.id}>{sg.name} (Сем {sg.semester})</option>)}
                        </select>
                    </div>
                    <div className="flex gap-3 justify-end mt-4">
                        <AmiButton type="button" variant="outline" onClick={onClose}>Скасувати</AmiButton>
                        <AmiButton type="submit">Зберегти</AmiButton>
                    </div>
                </form>
            </AmiPanel>
        </div>
    );
}

export function SelectiveGroupModal({ isOpen, onClose, onSaved, initialData, specialties, selectedSemester }) {
    const [formData, setFormData] = useState({
        name: '',
        semester: selectedSemester || 1,
        specialtyIds: []
    });

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData({
                    name: initialData.name || '',
                    semester: initialData.semester || 1,
                    specialtyIds: initialData.specialtyIds || []
                });
            } else {
                setFormData({
                    name: '',
                    semester: selectedSemester || 1,
                    specialtyIds: []
                });
            }
        }
    }, [isOpen, initialData, selectedSemester]);

    if (!isOpen) return null;

    const toggleSpecialty = (id) => {
        setFormData(prev => ({
            ...prev,
            specialtyIds: prev.specialtyIds.includes(id) 
                ? prev.specialtyIds.filter(sId => sId !== id)
                : [...prev.specialtyIds, id]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const method = initialData ? 'PUT' : 'POST';
            const url = initialData ? `/${initialData.id}` : '';
            
            const response = await fetchSelectiveGroupEndpoint(url, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                throw new Error('Помилка при збереженні групи вільного вибору');
            }

            const savedItem = await response.json();
            onSaved(savedItem, initialData ? 'update' : 'create');
            onClose();
        } catch (error) {
            alert(error.message);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <AmiPanel className="w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 bg-white">
                <h2 className="text-xl font-black mb-4">{initialData ? 'Редагувати групу' : 'Додати групу вільного вибору'}</h2>
                <form onSubmit={handleSubmit} className="grid gap-4">
                    <div>
                        <label className="block text-sm font-bold text-muted mb-1">Назва</label>
                        <input required type="text" className="w-full border rounded p-2" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-muted mb-1">Семестр</label>
                        <input required type="number" min="1" className="w-full border rounded p-2" value={formData.semester} onChange={e => setFormData({...formData, semester: Number(e.target.value)})} />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-muted mb-1">Прив'язка до спеціальностей</label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                            {specialties.map(s => (
                                <label key={s.id} className="flex items-center gap-2 text-sm">
                                    <input 
                                        type="checkbox" 
                                        checked={formData.specialtyIds.includes(s.id)}
                                        onChange={() => toggleSpecialty(s.id)}
                                    />
                                    {s.code} - {s.name}
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-3 justify-end mt-4">
                        <AmiButton type="button" variant="outline" onClick={onClose}>Скасувати</AmiButton>
                        <AmiButton type="submit">Зберегти</AmiButton>
                    </div>
                </form>
            </AmiPanel>
        </div>
    );
}
