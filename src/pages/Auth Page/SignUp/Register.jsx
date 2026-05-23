import { useState, useEffect, useContext, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import StatusMessage from '../../../components/StatusMessage/StatusMessage';
import { api } from '../../../api/client';
import { getTokenFromSearch } from '../../../auth/storage.js';
import { AuthContext } from '../../../context/auth-context.js';
import { extractPageContent } from '../../../utils/apiPayload.js';
import { createStatus, getErrorMessage, getValidationMessage } from '../../../utils/messages.js';
import { AmiButton } from '../../../ui/ami.jsx';
import { cn } from '../../../ui/cn.js';

const PASSWORD_PATTERN_SOURCE = String.raw`(?=.*\d)(?=.*[A-Z])(?=.*[a-z])\S{8,}`;
const PASSWORD_PATTERN = new RegExp(`^${PASSWORD_PATTERN_SOURCE}$`);
const PASSWORD_REQUIREMENTS_MESSAGE = 'Пароль має містити мінімум 8 символів: латинську велику літеру, латинську малу літеру та хоча б одну цифру. Спецсимволи дозволені.';

const PASSWORD_CHECKS = [
  { id: 'length', label: 'Мінімум 8 символів', test: (v) => v.length >= 8 },
  { id: 'upper', label: 'Велика літера', test: (v) => /[A-Z]/.test(v) },
  { id: 'lower', label: 'Мала літера', test: (v) => /[a-z]/.test(v) },
  { id: 'digit', label: 'Цифра', test: (v) => /\d/.test(v) },
];

function EyeIcon({ open }) {
  return open ? (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-10-8-10-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 8 10 8a18.5 18.5 0 0 1-2.16 3.19" />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24M1 1l22 22" />
    </svg>
  );
}

const Register = () => {
  const [formData, setFormData] = useState({
    lastName: '',
    firstName: '',
    email: '',
    password: '',
    repeatedPassword: '',
    specialty: '',
  });

  const [specialties, setSpecialties] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);
  const [status, setStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { register, authenticateWithToken } = useContext(AuthContext);

  const from = location.state?.from || '/profile';

  useEffect(() => {
    const token = getTokenFromSearch(location.search);
    if (token) {
      authenticateWithToken(token).then((result) => {
        navigate(result.success ? from : '/signin', { replace: true });
      });
    }
  }, [location.search, from, navigate, authenticateWithToken]);

  useEffect(() => {
    const fetchSpecialties = async () => {
      try {
        const response = await api.get('/specialties');
        const sortedSpecialties = extractPageContent(response.data)
          .sort((a, b) => String(a.number || '').localeCompare(String(b.number || '')))
          .map(specialty => specialty.name);
        setSpecialties(sortedSpecialties);
      } catch (error) {
        console.error('Error fetching specialties:', error);
        setStatus(createStatus('error', 'Не вдалося завантажити спеціальності'));
      }
    };

    fetchSpecialties();
  }, []);

  const passwordStrength = useMemo(() => {
    const passed = PASSWORD_CHECKS.filter((check) => check.test(formData.password)).length;
    return { passed, total: PASSWORD_CHECKS.length };
  }, [formData.password]);

  const passwordsMatch = formData.password && formData.password === formData.repeatedPassword;
  const showMismatch = formData.repeatedPassword && !passwordsMatch;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setStatus(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (formData.password !== formData.repeatedPassword) {
        setStatus(createStatus('error', getValidationMessage(false, 'Паролі не співпадають')));
        return;
      }

      if (!PASSWORD_PATTERN.test(formData.password)) {
        setStatus(createStatus('error', PASSWORD_REQUIREMENTS_MESSAGE));
        return;
      }

      const { lastName, firstName, email, password, repeatedPassword, specialty } = formData;
      const payload = { lastName, firstName, email, password, repeatedPassword, specialty };
      const result = await register(payload);

      if (!result.success) {
        setStatus(createStatus('error', result.error || 'Помилка реєстрації'));
        return;
      }

      navigate(from, { replace: true });
    } catch (error) {
      console.error('Registration error:', error);
      setStatus(createStatus('error', getErrorMessage(error, 'Помилка реєстрації')));
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldClass = "h-12 w-full rounded-ami border border-border bg-white px-4 text-sm/6 font-bold text-ink outline-hidden transition placeholder:text-muted focus:border-accent focus:ring-4 focus:ring-accent/15 sm:text-base/7 lg:h-11 lg:text-sm/6 2xl:h-13 2xl:text-base/7";

  const strengthBars = passwordStrength.passed;
  const strengthLabel =
    strengthBars === 0 ? '—'
      : strengthBars === 1 ? 'Слабкий'
        : strengthBars === 2 ? 'Помірний'
          : strengthBars === 3 ? 'Хороший'
            : 'Надійний';
  const strengthColor =
    strengthBars <= 1 ? 'text-red-700'
      : strengthBars === 2 ? 'text-amber-700'
        : strengthBars === 3 ? 'text-blue-700'
          : 'text-green-700';

  return (
    <div className="min-h-dvh bg-page text-ink">
      <div className="grid min-h-dvh lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        {/* DECORATIVE ASIDE */}
        <aside className="relative hidden overflow-hidden bg-linear-to-br from-accent via-accent-strong to-accent-hot p-10 text-white lg:flex lg:flex-col lg:justify-between lg:p-8 2xl:p-10">
          <div className="pointer-events-none absolute -right-40 -top-40 size-96 rounded-full bg-white/10 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute -left-20 bottom-0 size-72 rounded-full bg-white/10 blur-3xl" aria-hidden="true" />

          <Link to="/main" className="relative inline-flex w-fit items-center gap-2 rounded-ami border border-white/30 bg-white/10 px-4 py-3 text-xl/7 font-black text-white no-underline backdrop-blur transition hover:bg-white/15">
            <span className="grid size-7 place-items-center rounded-md bg-white text-accent-strong" aria-hidden="true">
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 2.7 20 6.1v5.8c0 5.1-3.3 8.4-8 9.9-4.7-1.5-8-4.8-8-9.9V6.1l8-3.4Z" />
                <path d="M8.4 13.6 12 7.4l3.6 6.2M9.7 11.5h4.6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
              </svg>
            </span>
            <span>AMI Portal</span>
          </Link>

          <div className="relative">
            <h2 className="m-0 font-sans text-[clamp(2rem,3.2vw,3.35rem)]/[1.05] font-black text-white">
              Створи профіль на AMI Portal
            </h2>
            <p className="m-0 mt-4 max-w-md text-base/7 font-bold text-white/85 md:text-lg/8">
              Вкажи спеціальність, заходь на форум і зберігай матеріали, які знадобляться під час навчання.
            </p>
          </div>

          <ul className="relative m-0 grid list-none gap-2.5 p-0">
            {[
              { label: 'Профіль', desc: 'Спеціальність, група й коротко про себе' },
              { label: 'Форум', desc: 'Пости й коментарі від студентів' },
              { label: 'Матеріали', desc: 'Корисні файли та лінки під рукою' },
            ].map(({ label, desc }) => (
              <li key={label} className="flex items-start gap-3 rounded-ami border border-white/60 bg-white/92 p-2.5 text-ink shadow-[0_14px_36px_rgb(39_20_24/0.14)] 2xl:p-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-ami bg-accent text-white shadow-[0_10px_24px_rgb(155_77_87/0.24)]" aria-hidden="true">
                  <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m5 13 4 4L19 7" />
                  </svg>
                </span>
                <div>
                  <strong className="block font-sans text-base/6 font-black text-ink">{label}</strong>
                  <span className="block text-sm/5 font-bold text-muted">{desc}</span>
                </div>
              </li>
            ))}
          </ul>
        </aside>

        {/* FORM */}
        <section className="flex items-center justify-center px-4 py-6 sm:px-6 lg:px-10 lg:py-4 2xl:py-8" aria-labelledby="signup-title">
          <div className="w-full max-w-md">
            <Link to="/main" className="mb-6 inline-flex items-center gap-2 rounded-ami border border-accent/30 bg-white px-4 py-3 text-lg/6 font-black text-ink no-underline transition hover:border-accent hover:bg-accent-soft lg:hidden">
              <span className="text-accent">AMI</span>
              <strong>Portal</strong>
            </Link>

            <h1 id="signup-title" className="m-0 font-sans text-3xl/9 font-black text-ink sm:text-4xl/11 lg:text-3xl/9 2xl:text-4xl/12">
              Створи свій акаунт
            </h1>
            <p className="m-0 mt-1.5 text-sm/6 font-bold text-muted sm:text-base/7 lg:text-sm/6 2xl:text-base/7">
              Потрібні ім&apos;я, пошта, пароль і спеціальність.
            </p>

            <form className="mt-5 grid gap-3 lg:mt-4 lg:gap-2.5 2xl:mt-7 2xl:gap-4" onSubmit={handleSubmit} noValidate>
              {status?.message && (
                <StatusMessage type={status?.type} message={status?.message} onDismiss={() => setStatus(null)} />
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <label className="font-sans text-xs/5 font-black uppercase tracking-wide text-muted" htmlFor="signup-last-name">Прізвище</label>
                  <input
                    id="signup-last-name"
                    type="text"
                    name="lastName"
                    placeholder="Ваше прізвище"
                    value={formData.lastName}
                    onChange={handleChange}
                    className={fieldClass}
                    autoComplete="family-name"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <label className="font-sans text-xs/5 font-black uppercase tracking-wide text-muted" htmlFor="signup-first-name">Ім&apos;я</label>
                  <input
                    id="signup-first-name"
                    type="text"
                    name="firstName"
                    placeholder="Ваше ім'я"
                    value={formData.firstName}
                    onChange={handleChange}
                    className={fieldClass}
                    autoComplete="given-name"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <label className="font-sans text-xs/5 font-black uppercase tracking-wide text-muted" htmlFor="signup-email">Електронна пошта</label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true">
                    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="5" width="18" height="14" rx="2" />
                      <path d="m3 7 9 6 9-6" />
                    </svg>
                  </span>
                  <input
                    id="signup-email"
                    type="email"
                    name="email"
                    placeholder="student@lnu.edu.ua"
                    value={formData.email}
                    onChange={handleChange}
                    className={cn(fieldClass, 'pl-12')}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <label className="font-sans text-xs/5 font-black uppercase tracking-wide text-muted" htmlFor="signup-password">Пароль</label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true">
                    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                  <input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Мінімум 8 символів"
                    value={formData.password}
                    onChange={handleChange}
                    className={cn(fieldClass, 'pl-12 pr-14')}
                    minLength={8}
                    pattern={PASSWORD_PATTERN_SOURCE}
                    title={PASSWORD_REQUIREMENTS_MESSAGE}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Сховати пароль' : 'Показати пароль'}
                    className="absolute right-2 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-ami border border-transparent bg-transparent text-muted transition duration-200 hover:border-border hover:bg-soft hover:text-ink focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-(--color-focus)"
                  >
                    <EyeIcon open={!showPassword} />
                  </button>
                </div>
                {formData.password && (
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex flex-1 gap-1">
                        {[0, 1, 2, 3].map((idx) => (
                          <span
                            key={idx}
                            className={cn(
                              'h-1.5 flex-1 rounded-full transition',
                              idx < strengthBars
                                ? strengthBars <= 1 ? 'bg-red-500'
                                  : strengthBars === 2 ? 'bg-amber-500'
                                    : strengthBars === 3 ? 'bg-blue-500'
                                      : 'bg-green-500'
                                : 'bg-soft',
                            )}
                          />
                        ))}
                      </div>
                      <span className={cn('text-xs/5 font-black', strengthColor)}>{strengthLabel}</span>
                    </div>
                    <ul className="m-0 grid list-none grid-cols-2 gap-1 p-0">
                      {PASSWORD_CHECKS.map((check) => {
                        const passed = check.test(formData.password);
                        return (
                          <li key={check.id} className={cn('inline-flex items-center gap-1.5 text-xs/5 font-bold', passed ? 'text-green-700' : 'text-muted')}>
                            <svg viewBox="0 0 24 24" className="size-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              {passed ? <path d="m5 13 4 4L19 7" /> : <circle cx="12" cy="12" r="9" />}
                            </svg>
                            {check.label}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>

              <div className="grid gap-2">
                <label className="font-sans text-xs/5 font-black uppercase tracking-wide text-muted" htmlFor="signup-repeat-password">Повторіть пароль</label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true">
                    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                  <input
                    id="signup-repeat-password"
                    type={showRepeatPassword ? 'text' : 'password'}
                    name="repeatedPassword"
                    placeholder="Той самий пароль ще раз"
                    value={formData.repeatedPassword}
                    onChange={handleChange}
                    className={cn(
                      fieldClass,
                      'pl-12 pr-14',
                      showMismatch && 'border-red-300 focus:border-red-500 focus:ring-red-500/20',
                      passwordsMatch && 'border-green-300 focus:border-green-500 focus:ring-green-500/20',
                    )}
                    minLength={8}
                    pattern={PASSWORD_PATTERN_SOURCE}
                    title={PASSWORD_REQUIREMENTS_MESSAGE}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowRepeatPassword((v) => !v)}
                    aria-label={showRepeatPassword ? 'Сховати пароль' : 'Показати пароль'}
                    className="absolute right-2 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-ami border border-transparent bg-transparent text-muted transition duration-200 hover:border-border hover:bg-soft hover:text-ink focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-(--color-focus)"
                  >
                    <EyeIcon open={!showRepeatPassword} />
                  </button>
                </div>
                {showMismatch && (
                  <span className="inline-flex items-center gap-1.5 text-xs/5 font-bold text-red-700">
                    <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M15 9l-6 6M9 9l6 6" />
                    </svg>
                    Паролі не співпадають
                  </span>
                )}
                {passwordsMatch && (
                  <span className="inline-flex items-center gap-1.5 text-xs/5 font-bold text-green-700">
                    <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="m5 13 4 4L19 7" />
                    </svg>
                    Паролі співпадають
                  </span>
                )}
              </div>

              <div className="grid gap-2">
                <label className="font-sans text-xs/5 font-black uppercase tracking-wide text-muted" htmlFor="signup-specialty">Спеціальність</label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true">
                    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 10 12 5 2 10l10 5 10-5Z" />
                      <path d="M6 12v5c0 1.5 3 3 6 3s6-1.5 6-3v-5" />
                    </svg>
                  </span>
                  <select
                    id="signup-specialty"
                    name="specialty"
                    value={formData.specialty}
                    onChange={handleChange}
                    className={cn(fieldClass, 'appearance-none pl-12 pr-12')}
                    required
                  >
                    <option value="" disabled>
                      Виберіть спеціальність
                    </option>
                    {specialties.map((specialty) => (
                      <option key={specialty} value={specialty}>
                        {specialty}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true">
                    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </span>
                </div>
              </div>

              <AmiButton type="submit" size="lg" loading={isSubmitting} className="mt-1 w-full 2xl:mt-2">
                Зареєструватися
              </AmiButton>

              <p className="m-0 text-center text-sm/6 font-bold text-muted">
                Вже маєш акаунт?{' '}
                <Link to="/signin" className="font-black text-accent-strong underline-offset-4 hover:underline">
                  Увійти
                </Link>
              </p>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Register;
