import PropTypes from 'prop-types';

function AboutSpecialtyCard({ specialtyImage, imageTitle, imageText }) {
    return (
        <article className="group flex h-full flex-col overflow-hidden rounded-ami border border-border bg-white shadow-[var(--shadow-ami-xs)] transition-[border-color,transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-[var(--shadow-ami-md)] motion-reduce:hover:translate-y-0">
            <div className="relative aspect-16/10 overflow-hidden bg-soft">
                {specialtyImage ? (
                    <img
                        src={specialtyImage}
                        alt=""
                        loading="lazy"
                        className="size-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04] motion-reduce:group-hover:scale-100"
                    />
                ) : (
                    <div className="grid size-full place-items-center text-muted" aria-hidden="true">
                        <svg viewBox="0 0 24 24" className="size-12" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <circle cx="9" cy="9" r="2" />
                            <path d="m21 15-5-5L5 21" />
                        </svg>
                    </div>
                )}
                <span className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-black/40 via-black/0 to-transparent" aria-hidden="true" />
            </div>
            <div className="flex flex-1 flex-col gap-3 p-5">
                <h3 className="m-0 font-sans text-lg/7 font-black text-ink transition-colors duration-200 group-hover:text-accent-strong">
                    {imageTitle}
                </h3>
                <p className="m-0 line-clamp-3 text-sm/6 font-bold text-muted">{imageText}</p>
                <span className="mt-auto inline-flex items-center gap-1.5 pt-2 text-sm/6 font-black text-accent-strong">
                    Дізнатись більше
                    <svg viewBox="0 0 24 24" className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M5 12h14M13 5l7 7-7 7" />
                    </svg>
                </span>
            </div>
        </article>
    );
}

AboutSpecialtyCard.propTypes = {
    specialtyImage: PropTypes.string,
    imageTitle: PropTypes.string.isRequired,
    imageText: PropTypes.string.isRequired,
};

export default AboutSpecialtyCard;
