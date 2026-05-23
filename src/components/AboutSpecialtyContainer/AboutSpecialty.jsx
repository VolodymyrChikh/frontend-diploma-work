import PropTypes from 'prop-types';
import { AmiPanel } from '../../ui/ami.jsx';

function CheckIcon({ className = 'size-4 text-accent' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m5 13 4 4L19 7" />
    </svg>
  );
}

CheckIcon.propTypes = {
  className: PropTypes.string,
};

function AboutSpecialty(props) {
  return (
    <AmiPanel className="overflow-hidden p-5 sm:p-8">
      <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:gap-5">
        <span className="inline-flex h-14 w-fit items-center rounded-ami border border-accent/30 bg-accent-soft px-4 font-sans text-2xl/7 font-black text-accent-strong">
          {props.specialtyNumber}
        </span>
        <div className="min-w-0">
          <span className="font-sans text-xs/5 font-black uppercase tracking-wide text-muted">Освітня програма</span>
          <h2 className="m-0 mt-1 font-sans text-2xl/8 font-black text-ink sm:text-3xl/10">
            {props.specialtyName}
          </h2>
        </div>
      </div>

      <p className="m-0 mt-6 max-w-3xl text-base/7 font-bold text-text sm:text-lg/8">
        {props.text}
      </p>

      <div className="mt-7 grid gap-4 lg:grid-cols-2">
        <section className="rounded-ami border border-border bg-surface p-5 sm:p-6">
          <header className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-ami border border-accent/30 bg-accent-soft text-accent" aria-hidden="true">
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2Z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7Z" />
              </svg>
            </span>
            <h3 className="m-0 font-sans text-lg/7 font-black text-ink sm:text-xl/8">Що ти тут вивчатимеш</h3>
          </header>
          <ul className="m-0 mt-4 grid list-none gap-3 p-0 text-base/7 font-bold text-text">
            {props.whatYouLearn.map((item, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <span className="mt-1 grid size-5 shrink-0 place-items-center rounded-full bg-accent-soft">
                  <CheckIcon className="size-3 text-accent" />
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-ami border border-border bg-surface p-5 sm:p-6">
          <header className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-ami border border-green-200 bg-green-50 text-green-700" aria-hidden="true">
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            </span>
            <h3 className="m-0 font-sans text-lg/7 font-black text-ink sm:text-xl/8">Кар&apos;єрні можливості</h3>
          </header>
          <ul className="m-0 mt-4 grid list-none gap-3 p-0 text-base/7 font-bold text-text">
            {props.careerOpportunities.map((item, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <span className="mt-1 grid size-5 shrink-0 place-items-center rounded-full bg-green-50">
                  <CheckIcon className="size-3 text-green-700" />
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </AmiPanel>
  );
}

AboutSpecialty.propTypes = {
  specialtyNumber: PropTypes.string,
  specialtyName: PropTypes.string,
  text: PropTypes.node,
  whatYouLearn: PropTypes.arrayOf(PropTypes.string),
  careerOpportunities: PropTypes.arrayOf(PropTypes.string),
};

export default AboutSpecialty;
