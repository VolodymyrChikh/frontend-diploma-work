import { createElement } from 'react';
import { cn } from './cn.js';

export function AmiContainer({ as: Component = 'div', className = '', children, ...props }) {
  return createElement(
    Component,
    {
      className: cn('mx-auto w-full max-w-[1184px] px-4 sm:px-6 lg:px-8', className),
      ...props,
    },
    children,
  );
}

export function AmiPanel({ as: Component = 'section', className = '', children, ...props }) {
  return createElement(
    Component,
    {
      className: cn('rounded-ami border border-border bg-surface-strong shadow-[var(--shadow-ami-xs)]', className),
      ...props,
    },
    children,
  );
}

const buttonVariants = {
  primary:
    'border-accent bg-accent text-white shadow-[0_10px_24px_rgb(155_77_87/0.24)] hover:border-accent-strong hover:bg-accent-strong hover:shadow-[0_14px_32px_rgb(155_77_87/0.30)] active:bg-accent-strong',
  secondary:
    'border-border bg-white text-ink shadow-[var(--shadow-ami-xs)] hover:border-ink hover:bg-ink hover:text-white hover:shadow-[var(--shadow-ami-sm)] active:bg-ink/90',
  ghost:
    'border-transparent bg-transparent text-muted hover:bg-soft hover:text-ink active:bg-soft',
  soft:
    'border-accent/20 bg-accent-soft text-accent-strong hover:border-accent/35 hover:bg-accent-soft hover:text-accent-strong active:bg-accent-soft',
  danger:
    'border-red-200 bg-red-50 text-red-700 hover:border-red-600 hover:bg-red-600 hover:text-white active:bg-red-700',
};

const buttonSizes = {
  sm: 'min-h-9 px-3 text-sm/6',
  md: 'min-h-11 px-4 text-sm/6',
  lg: 'min-h-12 px-5 text-base/7',
};

export function AmiButton({
  as: Component = 'button',
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  disabled,
  children,
  ...props
}) {
  const isDisabled = disabled || loading;

  return createElement(
    Component,
    {
      className: cn(
        'group relative inline-flex select-none items-center justify-center gap-2 rounded-ami border font-sans font-extrabold tracking-wide transition-[background-color,color,border-color,transform] duration-(--motion-standard) ease-(--motion-ease-out)',
        'hover:-translate-y-0.5 active:translate-y-px motion-reduce:hover:translate-y-0 motion-reduce:active:translate-y-0',
        'focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-(--color-focus)',
        'disabled:pointer-events-none disabled:opacity-55',
        buttonVariants[variant],
        buttonSizes[size],
        loading && 'cursor-progress',
        className,
      ),
      'aria-busy': loading || undefined,
      disabled: isDisabled,
      ...props,
    },
    loading
      ? createElement(
          'span',
          {
            className: 'inline-flex items-center gap-2',
            'aria-live': 'polite',
          },
          createElement('span', {
            'aria-hidden': 'true',
            className:
              'inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent',
          }),
          children,
        )
      : children,
  );
}

export function AmiIconButton({
  as: Component = 'button',
  className = '',
  size = 'md',
  children,
  ...props
}) {
  const sizeClass =
    size === 'sm' ? 'size-9' : size === 'lg' ? 'size-12' : 'size-10';
  return createElement(
    Component,
    {
      className: cn('ami-topbar-action', sizeClass, className),
      ...props,
    },
    children,
  );
}
