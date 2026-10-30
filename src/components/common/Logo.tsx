import React from 'react';

export interface LogoProps {
  /**
   * Logo variant:
   * - 'full': Icon + 'WorkNest' wordmark (Work in white/dark, Nest in #FF790F)
   * - 'icon': Stacked layers rounded icon only
   * - 'compact': Compact layout for collapsed navigation or small headers
   */
  variant?: 'full' | 'icon' | 'compact';
  /**
   * Predefined or numerical size for the icon (default: 'md')
   */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  /**
   * Optional custom subtitle displayed beneath the wordmark (e.g., 'Enterprise SaaS')
   */
  subtitle?: string;
  /**
   * Additional wrapper class names
   */
  className?: string;
  /**
   * Custom class names for the icon container
   */
  iconClassName?: string;
  /**
   * Custom class names for the wordmark text
   */
  textClassName?: string;
  /**
   * Optional click handler
   */
  onClick?: () => void;
  /**
   * Whether to animate elements on hover / appearance
   */
  animate?: boolean;
}

export const LogoIcon: React.FC<{
  size?: number | string;
  className?: string;
  title?: string;
}> = ({ size = '100%', className = '', title = 'WorkNest' }) => (
  <svg
    viewBox="0 0 100 100"
    width={typeof size === 'number' ? size : undefined}
    height={typeof size === 'number' ? size : undefined}
    className={typeof size === 'string' && size !== '100%' ? `${size} ${className}` : className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label={title}
  >
    <title>{title}</title>
    <defs>
      {/* Charcoal container gradient */}
      <linearGradient id="wnIconBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#181818" />
        <stop offset="50%" stopColor="#121212" />
        <stop offset="100%" stopColor="#0B0B0B" />
      </linearGradient>

      {/* Top plate gradient (rich warm orange with golden highlight) */}
      <linearGradient id="wnIconTopPlate" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFA238" />
        <stop offset="40%" stopColor="#FF8015" />
        <stop offset="100%" stopColor="#F36600" />
      </linearGradient>

      {/* Middle plate gradient */}
      <linearGradient id="wnIconMidPlate" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF8B22" />
        <stop offset="60%" stopColor="#FF740A" />
        <stop offset="100%" stopColor="#E35800" />
      </linearGradient>

      {/* Bottom plate gradient */}
      <linearGradient id="wnIconBotPlate" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF790F" />
        <stop offset="60%" stopColor="#F06500" />
        <stop offset="100%" stopColor="#D14C00" />
      </linearGradient>
    </defs>

    {/* Rounded squircle container with subtle glowing orange border */}
    <rect
      x="5"
      y="5"
      width="90"
      height="90"
      rx="22"
      fill="url(#wnIconBgGrad)"
      stroke="#FF790F"
      strokeWidth="1.5"
      strokeOpacity="0.45"
    />
    <rect
      x="5.75"
      y="5.75"
      width="88.5"
      height="88.5"
      rx="21.25"
      fill="none"
      stroke="#FF790F"
      strokeWidth="0.5"
      strokeOpacity="0.2"
    />

    {/* 1. TOP ISOMETRIC LAYER */}
    <g>
      <path
        d="M 46.5 22.8 C 48.7 21.6 51.3 21.6 53.5 22.8 L 76.8 35.8 C 79 37 79.8 39.4 78.6 41 L 53.5 53.8 C 51.3 54.9 48.7 54.9 46.5 53.8 L 21.4 41 C 20.2 39.4 21 37 23.2 35.8 Z"
        fill="url(#wnIconTopPlate)"
      />
      <path
        d="M 47 23 L 76.5 35.8"
        stroke="#FFE0B2"
        strokeWidth="0.8"
        strokeLinecap="round"
        strokeOpacity="0.6"
      />
    </g>

    {/* 2. MIDDLE ISOMETRIC LAYER */}
    <path
      d="M 20.8 45.5 C 20.8 43.8 22.2 42.8 23.6 43.6 L 47.2 55.6 C 48.9 56.5 51.1 56.5 52.8 55.6 L 76.4 43.6 C 77.8 42.8 79.2 43.8 79.2 45.5 L 79.2 49.2 C 79.2 50.9 78.1 52.3 76.6 53.1 L 52.8 65.2 C 51.1 66.1 48.9 66.1 47.2 65.2 L 23.4 53.1 C 21.9 52.3 20.8 50.9 20.8 49.2 Z"
      fill="url(#wnIconMidPlate)"
    />

    {/* 3. BOTTOM ISOMETRIC LAYER */}
    <path
      d="M 20.8 58.5 C 20.8 56.8 22.2 55.8 23.6 55.6 L 47.2 67.6 C 48.9 68.5 51.1 68.5 52.8 67.6 L 76.4 55.6 C 77.8 54.8 79.2 55.8 79.2 57.5 L 79.2 61.2 C 79.2 62.9 78.1 64.3 76.6 65.1 L 52.8 77.2 C 51.1 78.1 48.9 78.1 47.2 77.2 L 23.4 65.1 C 21.9 64.3 20.8 62.9 20.8 61.2 Z"
      fill="url(#wnIconBotPlate)"
    />
  </svg>
);

export const Logo: React.FC<LogoProps> = ({
  variant = 'full',
  size = 'md',
  subtitle,
  className = '',
  iconClassName = '',
  textClassName = '',
  onClick,
  animate = true,
}) => {
  // Map size tokens to dimensions and typography
  const sizeConfig = {
    xs: {
      iconBox: 'w-6 h-6',
      text: 'text-sm',
      sub: 'text-[9px]',
      gap: 'gap-1.5',
    },
    sm: {
      iconBox: 'w-7 h-7',
      text: 'text-base',
      sub: 'text-[10px]',
      gap: 'gap-2',
    },
    md: {
      iconBox: 'w-9 h-9',
      text: 'text-lg',
      sub: 'text-[10px]',
      gap: 'gap-2.5',
    },
    lg: {
      iconBox: 'w-11 h-11',
      text: 'text-xl',
      sub: 'text-xs',
      gap: 'gap-3',
    },
    xl: {
      iconBox: 'w-14 h-14',
      text: 'text-2xl',
      sub: 'text-xs',
      gap: 'gap-3.5',
    },
  };

  const currentSize = typeof size === 'string' ? sizeConfig[size] : sizeConfig.md;
  const isCompact = variant === 'compact';
  const isIconOnly = variant === 'icon';

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`inline-flex items-center ${currentSize.gap} select-none ${
        onClick ? 'cursor-pointer group' : ''
      } ${className}`}
    >
      {/* Icon Container */}
      <div
        className={`${currentSize.iconBox} shrink-0 rounded-2xl flex items-center justify-center p-0.5 transition-transform duration-200 ${
          onClick && animate ? 'group-hover:scale-105' : ''
        } ${iconClassName}`}
      >
        <LogoIcon className="w-full h-full drop-shadow-[0_2px_8px_rgba(255,121,15,0.25)]" />
      </div>

      {/* Wordmark (hidden if variant is 'icon' or 'compact') */}
      {!isIconOnly && !isCompact && (
        <div className={`flex flex-col leading-none ${animate ? 'animate-fade-in' : ''}`}>
          <span
            className={`${currentSize.text} font-bold tracking-tight text-[#171717] dark:text-[#FAFAFA] font-sans ${textClassName}`}
          >
            Work<span className="text-[#FF790F]">Nest</span>
          </span>
          {subtitle && (
            <span className={`mt-0.5 ${currentSize.sub} text-[#737373] dark:text-[#A3A3A3] font-medium tracking-wide`}>
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
