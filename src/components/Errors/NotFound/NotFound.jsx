import { Link, useNavigate } from 'react-router-dom';
import Header from '../../Header/Header';
import Footer from '../../Footer/Footer';
import { AmiButton, AmiContainer, AmiPanel } from '../../../ui/ami.jsx';

function NotFound() {
    const navigate = useNavigate();

    return (
        <div className="min-h-dvh bg-page text-ink">
            <Header />
            <main className="relative overflow-hidden">
                <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[60vh] bg-linear-to-b from-accent-soft/60 to-transparent" aria-hidden="true" />
                <div className="pointer-events-none absolute -right-32 top-12 -z-10 size-72 rounded-full bg-accent/10 blur-3xl" aria-hidden="true" />
                <div className="pointer-events-none absolute -left-24 top-40 -z-10 size-64 rounded-full bg-accent/10 blur-3xl" aria-hidden="true" />

                <AmiContainer className="grid place-items-center py-16 lg:py-24">
                    <AmiPanel className="grid w-full max-w-2xl gap-6 p-8 text-center sm:p-12">
                        <div className="relative mx-auto" aria-hidden="true">
                            <span className="bg-linear-to-b from-accent-strong to-accent-hot bg-clip-text font-sans text-[clamp(7rem,18vw,12rem)]/[1] font-black text-transparent">
                                404
                            </span>
                        </div>

                        <div className="grid gap-3">
                            <h1 className="m-0 font-sans text-3xl/10 font-black text-ink sm:text-4xl/12">
                                Сторінку не знайдено
                            </h1>
                            <p className="m-0 mx-auto max-w-md text-base/7 font-bold text-muted md:text-lg/8">
                                Здається, ти заблукав у коридорах факультету. Спробуй повернутись на головну або переглянути форум.
                            </p>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
                            <AmiButton size="lg" onClick={() => navigate('/main')}>
                                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <path d="m3 11 9-8 9 8" />
                                    <path d="M5 10v10h14V10" />
                                </svg>
                                На головну
                            </AmiButton>
                            <AmiButton as={Link} to="/forum" variant="secondary" size="lg" className="no-underline">
                                До форуму
                            </AmiButton>
                            <AmiButton variant="ghost" size="lg" onClick={() => navigate(-1)}>
                                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <path d="M19 12H5M12 19l-7-7 7-7" />
                                </svg>
                                Назад
                            </AmiButton>
                        </div>
                    </AmiPanel>
                </AmiContainer>
            </main>
            <Footer />
        </div>
    );
}

export default NotFound;
