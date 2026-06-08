/**
 * AirPak Express - Brand Engine
 * Auto-injection of AirPak logo and branding across all pages
 */

// AirPak Brand Colors
export const BrandColors = {
  primary: '#DC2626',      // AirPak Red
  primaryDark: '#B91C1C',  // Dark Red
  primaryLight: '#EF4444', // Light Red
  scriptRed: '#E63946',    // Script Logo Red
  secondary: '#0F172A',     // Dark Navy
  secondaryLight: '#1E293B',
  accent: '#F59E0B',       // Amber
  success: '#10B981',      // Emerald
  warning: '#F59E0B',      // Amber
  error: '#EF4444',        // Red
  info: '#3B82F6',         // Blue
  white: '#FFFFFF',
  black: '#000000',
  slate: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
    950: '#020617',
  }
};

// AirPak Logo SVG (Red Script)
export const AirPakLogo = `
<svg viewBox="0 0 200 50" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#DC2626"/>
      <stop offset="100%" style="stop-color:#EF4444"/>
    </linearGradient>
  </defs>
  <text x="10" y="38" font-family="Georgia, serif" font-size="32" font-weight="bold" fill="url(#logoGrad)">Air</text>
  <text x="65" y="38" font-family="Georgia, serif" font-size="32" font-style="italic" fill="#0F172A">Pak</text>
  <text x="115" y="38" font-family="Arial, sans-serif" font-size="10" fill="#64748B" letter-spacing="2">EXPRESS</text>
</svg>
`;

// Full Logo with Truck Icon
export const AirPakLogoWithIcon = `
<svg viewBox="0 0 250 50" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="logoGradFull" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#DC2626"/>
      <stop offset="100%" style="stop-color:#EF4444"/>
    </linearGradient>
  </defs>
  <!-- Truck Icon -->
  <rect x="5" y="10" width="40" height="30" rx="4" fill="url(#logoGradFull)"/>
  <rect x="45" y="20" width="15" height="20" rx="2" fill="#0F172A"/>
  <circle cx="15" cy="42" r="5" fill="#0F172A"/>
  <circle cx="35" cy="42" r="5" fill="#0F172A"/>
  <circle cx="52" cy="42" r="5" fill="#0F172A"/>
  <rect x="8" y="15" width="12" height="10" rx="1" fill="white" opacity="0.9"/>
  <rect x="22" y="15" width="12" height="10" rx="1" fill="white" opacity="0.9"/>
  <rect x="8" y="27" width="12" height="8" rx="1" fill="white" opacity="0.9"/>
  <rect x="22" y="27" width="12" height="8" rx="1" fill="white" opacity="0.9"/>
  <!-- Logo Text -->
  <text x="70" y="30" font-family="Georgia, serif" font-size="24" font-weight="bold" fill="url(#logoGradFull)">Air</text>
  <text x="105" y="30" font-family="Georgia, serif" font-size="24" font-style="italic" fill="#0F172A">Pak</text>
  <text x="155" y="30" font-family="Arial, sans-serif" font-size="8" fill="#64748B" letter-spacing="1.5">EXPRESS</text>
</svg>
`;

// Mini Logo for sidebar/header
export const AirPakMiniLogo = `
<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="miniGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#DC2626"/>
      <stop offset="100%" style="stop-color:#EF4444"/>
    </linearGradient>
  </defs>
  <rect x="2" y="8" width="28" height="20" rx="3" fill="url(#miniGrad)"/>
  <rect x="30" y="14" width="10" height="14" rx="2" fill="#0F172A"/>
  <circle cx="8" cy="30" r="4" fill="#0F172A"/>
  <circle cx="22" cy="30" r="4" fill="#0F172A"/>
  <circle cx="35" cy="30" r="4" fill="#0F172A"/>
  <rect x="4" y="11" width="8" height="6" rx="1" fill="white" opacity="0.9"/>
  <rect x="14" y="11" width="8" height="6" rx="1" fill="white" opacity="0.9"/>
</svg>
`;

// Footer Logo
export const AirPakFooterLogo = `
<svg viewBox="0 0 180 45" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="footerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#DC2626"/>
      <stop offset="100%" style="stop-color:#EF4444"/>
    </linearGradient>
  </defs>
  <text x="5" y="28" font-family="Georgia, serif" font-size="26" font-weight="bold" fill="url(#footerGrad)">Air</text>
  <text x="52" y="28" font-family="Georgia, serif" font-size="26" font-style="italic" fill="#FFFFFF">Pak</text>
  <text x="98" y="28" font-family="Arial, sans-serif" font-size="9" fill="#94A3B8" letter-spacing="1.5">EXPRESS</text>
  <line x1="5" y1="35" x2="175" y2="35" stroke="#334155" stroke-width="1"/>
  <text x="5" y="42" font-family="Arial, sans-serif" font-size="8" fill="#64748B">Global Logistics Solutions</text>
</svg>
`;

// Favicon SVG
export const AirPakFavicon = `
<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="favGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#DC2626"/>
      <stop offset="100%" style="stop-color:#EF4444"/>
    </linearGradient>
  </defs>
  <rect x="2" y="6" width="22" height="16" rx="2" fill="url(#favGrad)"/>
  <rect x="24" y="11" width="8" height="11" rx="1" fill="#0F172A"/>
  <circle cx="7" cy="24" r="3" fill="#0F172A"/>
  <circle cx="17" cy="24" r="3" fill="#0F172A"/>
  <circle cx="28" cy="24" r="3" fill="#0F172A"/>
</svg>
`;

// Script Logo SVG (Pacifico style)
export const AirPakScriptLogo = `
<svg viewBox="0 0 300 120" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="scriptGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#E63946"/>
      <stop offset="100%" style="stop-color:#D62839"/>
    </linearGradient>
  </defs>
  <!-- Script Airpak text -->
  <text x="20" y="85" font-family="'Pacifico', cursive, sans-serif" font-size="72" fill="url(#scriptGrad)">Airpak</text>
  <!-- Registered trademark -->
  <text x="225" y="45" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#1F2937">®</text>
</svg>
`;

// Script Logo with Icon
export const AirPakScriptLogoWithIcon = `
<svg viewBox="0 0 400 120" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="scriptGradIcon" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#E63946"/>
      <stop offset="100%" style="stop-color:#D62839"/>
    </linearGradient>
  </defs>
  <!-- Truck Icon -->
  <g transform="translate(10, 25)">
    <rect x="0" y="15" width="50" height="35" rx="5" fill="url(#scriptGradIcon)"/>
    <rect x="50" y="28" width="20" height="22" rx="3" fill="#0F172A"/>
    <circle cx="12" cy="55" r="7" fill="#0F172A"/>
    <circle cx="38" cy="55" r="7" fill="#0F172A"/>
    <circle cx="60" cy="55" r="7" fill="#0F172A"/>
    <rect x="4" y="22" width="15" height="12" rx="2" fill="white" opacity="0.9"/>
    <rect x="22" y="22" width="15" height="12" rx="2" fill="white" opacity="0.9"/>
    <rect x="4" y="38" width="15" height="8" rx="1" fill="white" opacity="0.9"/>
    <rect x="22" y="38" width="15" height="8" rx="1" fill="white" opacity="0.9"/>
  </g>
  <!-- Script Airpak text -->
  <text x="95" y="80" font-family="'Pacifico', cursive, sans-serif" font-size="58" fill="url(#scriptGradIcon)">Airpak</text>
  <!-- Registered trademark -->
  <text x="305" y="45" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#1F2937">®</text>
</svg>
`;

// Brand Typography
export const BrandTypography = {
  fontFamily: {
    heading: "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
    body: "'Inter', 'SF Pro Text', -apple-system, BlinkMacSystemFont, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', monospace",
  },
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',      // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem',    // 48px
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
};

// Brand CSS Variables
export const BrandCSSVariables = `
:root {
  /* Primary Colors */
  --airpak-primary: ${BrandColors.primary};
  --airpak-primary-dark: ${BrandColors.primaryDark};
  --airpak-primary-light: ${BrandColors.primaryLight};

  /* Secondary Colors */
  --airpak-secondary: ${BrandColors.secondary};
  --airpak-secondary-light: ${BrandColors.secondaryLight};

  /* Accent Colors */
  --airpak-accent: ${BrandColors.accent};
  --airpak-success: ${BrandColors.success};
  --airpak-warning: ${BrandColors.warning};
  --airpak-error: ${BrandColors.error};
  --airpak-info: ${BrandColors.info};

  /* Typography */
  --airpak-font-heading: ${BrandTypography.fontFamily.heading};
  --airpak-font-body: ${BrandTypography.fontFamily.body};
  --airpak-font-mono: ${BrandTypography.fontFamily.mono};

  /* Shadows */
  --airpak-shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --airpak-shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --airpak-shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --airpak-shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);

  /* Border Radius */
  --airpak-radius-sm: 0.25rem;
  --airpak-radius-md: 0.375rem;
  --airpak-radius-lg: 0.5rem;
  --airpak-radius-xl: 0.75rem;
  --airpak-radius-2xl: 1rem;
  --airpak-radius-full: 9999px;

  /* Transitions */
  --airpak-transition-fast: 150ms;
  --airpak-transition-normal: 300ms;
  --airpak-transition-slow: 500ms;
}
`;

// Auto-inject brand styles
export const injectBrandStyles = () => {
  if (typeof document === 'undefined') return;

  // Check if already injected
  if (document.getElementById('airpak-brand-styles')) return;

  const style = document.createElement('style');
  style.id = 'airpak-brand-styles';
  style.textContent = BrandCSSVariables;
  document.head.appendChild(style);

  // Update favicon
  const favicon = document.querySelector("link[rel='icon']") as HTMLLinkElement;
  if (favicon) {
    favicon.href = `data:image/svg+xml,${encodeURIComponent(AirPakFavicon)}`;
  }
};

// Get logo as data URL
export const getLogoDataUrl = (type: 'full' | 'mini' | 'footer' = 'full'): string => {
  const logo = type === 'full' ? AirPakLogoWithIcon : type === 'mini' ? AirPakMiniLogo : AirPakFooterLogo;
  return `data:image/svg+xml,${encodeURIComponent(logo)}`;
};

// Brand configurations for different contexts
export const BrandContext = {
  // Header logo config
  header: {
    height: '40px',
    width: 'auto',
    className: 'airpak-logo-header',
  },
  // Sidebar logo config
  sidebar: {
    height: '36px',
    width: 'auto',
    className: 'airpak-logo-sidebar',
  },
  // Document header config
  document: {
    height: '50px',
    width: '200px',
    className: 'airpak-logo-document',
  },
  // Invoice header config
  invoice: {
    height: '60px',
    width: '180px',
    className: 'airpak-logo-invoice',
  },
  // Email header config
  email: {
    height: '45px',
    width: '160px',
    className: 'airpak-logo-email',
  },
  // Footer config
  footer: {
    height: '45px',
    width: '180px',
    className: 'airpak-logo-footer',
  },
};

// Generate branded document header
export const generateDocumentHeader = (title: string, subtitle?: string) => ({
  logo: AirPakLogoWithIcon,
  title,
  subtitle: subtitle || 'Official Document',
  brandColor: BrandColors.primary,
  secondaryColor: BrandColors.secondary,
});

// Generate branded invoice header
export const generateInvoiceHeader = (invoiceNumber: string, date: string) => ({
  logo: AirPakLogoWithIcon,
  invoiceNumber,
  date,
  companyName: 'AirPak Express',
  companyAddress: '123 Logistics Way, New York, NY 10001',
  companyPhone: '+1 (555) 123-4567',
  companyEmail: 'support@airpak.express',
  brandColor: BrandColors.primary,
});

// Export all brand assets
export const BrandAssets = {
  colors: BrandColors,
  typography: BrandTypography,
  logo: {
    full: AirPakLogoWithIcon,
    text: AirPakLogo,
    mini: AirPakMiniLogo,
    footer: AirPakFooterLogo,
    favicon: AirPakFavicon,
  },
  cssVariables: BrandCSSVariables,
  contexts: BrandContext,
  helpers: {
    injectBrandStyles,
    getLogoDataUrl,
    generateDocumentHeader,
    generateInvoiceHeader,
  },
};

export default BrandAssets;
