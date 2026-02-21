import React from 'react';

/**
 * Логотип Veydo: синий скруглённый квадрат (squircle) с белым треугольником Play.
 * Используется в шапке, сайдбаре, странице входа, favicon.
 *
 * @param {string} [className] — классы для размера (напр. w-8 h-8, w-12 h-12)
 * @param {string} [ariaLabel] — доступное описание (по умолчанию "Veydo")
 */
function Logo({ className = 'w-8 h-8', ariaLabel = 'Veydo', ...props }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label={ariaLabel}
      role="img"
      {...props}
    >
      {/* Скруглённый квадрат (squircle), синий фон */}
      <rect
        x="2"
        y="2"
        width="28"
        height="28"
        rx="8"
        ry="8"
        fill="#2588FF"
      />
      {/* Белый треугольник Play: база слева, вершина справа, по центру */}
      <path
        d="M12 9L12 23L24 16L12 9Z"
        fill="white"
      />
    </svg>
  );
}

/**
 * Логотип с подписью "VEYDO" — для шапки, сайдбара, футера.
 * @param {string} [logoClassName] — размер иконки (по умолчанию w-8 h-8)
 * @param {string} [textClassName] — классы для текста (по умолчанию text-xl font-bold text-gray-900 tracking-tight)
 */
function LogoWithWordmark({ logoClassName = 'w-8 h-8', textClassName = 'text-xl font-bold text-gray-900 tracking-tight', ...props }) {
  return (
    <span className="inline-flex items-center gap-3" {...props}>
      <Logo className={logoClassName} ariaLabel="Veydo" />
      <span className={textClassName}>VEYDO</span>
    </span>
  );
}

export default Logo;
export { LogoWithWordmark };
