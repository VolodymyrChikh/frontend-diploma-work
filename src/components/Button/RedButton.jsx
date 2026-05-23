import PropTypes from 'prop-types';
import { cn } from '../../ui/cn.js';

function RedButton({ text, className = '', ...props }) {
    return (
        <button
            type="button"
            className={cn(
                'inline-flex min-h-12 items-center justify-center gap-2 rounded-ami border border-transparent bg-transparent px-5 text-sm/6 font-black tracking-wide text-accent-strong',
                'transition-[background-color,color] duration-(--motion-standard) ease-(--motion-ease-out)',
                'hover:bg-accent hover:text-white',
                'active:bg-accent-strong',
                'focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-(--color-focus)',
                'disabled:pointer-events-none disabled:opacity-55',
                className,
            )}
            {...props}
        >
            {text}
        </button>
    );
}

RedButton.propTypes = {
    text: PropTypes.string.isRequired,
    className: PropTypes.string,
};

export default RedButton;
