import { useContext, useEffect, useMemo, useState } from "react";
import { AmiPanel, AmiContainer } from "../../ui/ami.jsx";
import { apiGet } from "../../api/client";
import { AuthContext } from "../../context/auth-context.js";

const DAY_ORDER = ['Понеділок', 'Вівторок', 'Середа', 'Четвер', "П'ятниця", 'Субота', 'Неділя'];

function normalizeGroupName(value) {
  return String(value || '').trim();
}

function ProfileSchedule({ user: propUser }) {
  const { user: authUser } = useContext(AuthContext);
  const user = propUser || authUser;
  const [lessons, setLessons] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const groupName = normalizeGroupName(user?.groupResponse?.name || user?.groupName || "");

  useEffect(() => {
    if (!groupName) {
      setLessons([]);
      return;
    }

    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await apiGet(`/api/lessons?groupName=${encodeURIComponent(groupName)}`);
        if (!cancelled) setLessons(data || []);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Не вдалося завантажити розклад');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [groupName]);

  const entriesByDay = useMemo(() => {
    const map = new Map();
    for (const lesson of lessons) {
      const day = lesson.dayOfWeek || 'Інше';
      if (!map.has(day)) map.set(day, []);
      map.get(day).push(lesson);
    }
    for (const [day, arr] of map) {
      arr.sort((a, b) => (a.pairNumber || 0) - (b.pairNumber || 0) || ((a.timeStart || '') < (b.timeStart || '') ? -1 : 1));
    }
    return map;
  }, [lessons]);

  return (
    <AmiContainer>
      <AmiPanel className="border-0 bg-transparent shadow-none">
        <h3 className="m-0 mb-4 text-xl font-black">Розклад для групи {groupName || '—'}</h3>
        {!groupName && (
          <p className="text-muted">Група не вказана у профілі. Додайте групу, щоб побачити розклад.</p>
        )}

        {groupName && isLoading && <p>Завантаження…</p>}
        {groupName && error && <p className="text-red-600">{error}</p>}

        {groupName && !isLoading && !error && (
          <div className="grid gap-4">
            {DAY_ORDER.map((day) => {
              const entries = entriesByDay.get(day) || [];
              return (
                <div key={day} className="rounded-ami border border-border bg-soft p-3">
                  <h4 className="m-0 mb-2 font-black">{day}</h4>
                  {entries.length === 0 ? (
                    <div className="text-muted">Пар немає</div>
                  ) : (
                    <ul className="m-0 list-none p-0">
                      {entries.map((e) => (
                        <li key={e.id} className="mb-2">
                          <div className="font-extrabold">{e.pairLabel || e.pairNumber || ''} · {e.timeStart || '—'}–{e.timeEnd || '—'}</div>
                          <div className="text-sm/6 font-bold">{e.subjectName || e.rawText || 'Невідомо'}</div>
                          <div className="text-xs text-muted">{e.room ? `Ауд: ${e.room}` : ''} {e.teachers?.length ? ` · ${e.teachers.join(', ')}` : ''}</div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </AmiPanel>
    </AmiContainer>
  );
}

export default ProfileSchedule;
