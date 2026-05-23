import PropTypes from 'prop-types';
import { cn } from '../../ui/cn.js';

function TransparentButton({ text = 'Більше', className = '', ...props }) {
    return (
        <button
            type="button"
            className={cn(
                'inline-flex min-h-12 items-center justify-center gap-2 rounded-ami border border-transparent bg-transparent px-5 text-sm/6 font-black tracking-wide text-ink',
                'transition-[background-color,color] duration-(--motion-standard) ease-(--motion-ease-out)',
                'hover:bg-ink hover:text-white',
                'active:bg-ink/90',
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

TransparentButton.propTypes = {
    text: PropTypes.string,
    className: PropTypes.string,
};

export default TransparentButton;
