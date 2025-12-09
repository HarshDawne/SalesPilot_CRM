/**
 * Design Tokens for HyperSell CRM
 * Matches the existing design system from the CRM dashboard
 */

export const COLORS = {
    // Primary brand color (Indigo)
    primary: {
        50: '#eef2ff',
        100: '#e0e7ff',
        200: '#c7d2fe',
        300: '#a5b4fc',
        400: '#818cf8',
        500: '#6366f1',
        600: '#4338ca', // Main brand color
        700: '#3730a3',
        800: '#312e81',
        900: '#1e1b4b',
    },

    // Sidebar colors
    sidebar: {
        bg: '#0f172a',
        hover: '#1e293b',
        active: '#334155',
        text: '#e2e8f0',
        textMuted: '#94a3b8',
    },

    // Status colors for units, projects, and buildings
    status: {
        available: '#10b981',      // Green
        reserved: '#f59e0b',       // Amber
        negotiation: '#3b82f6',    // Blue
        booked: '#8b5cf6',         // Purple
        blocked: '#ef4444',        // Red
        planning: '#6b7280',       // Gray
        construction: '#f97316',   // Orange
        active: '#10b981',         // Green
        completed: '#06b6d4',      // Cyan
    },
} as const;

export const TYPOGRAPHY = {
    fontFamily: {
        heading: 'Outfit, sans-serif',
        body: 'Inter, sans-serif',
    },
    fontSize: {
        xs: '0.75rem',     // 12px
        sm: '0.875rem',    // 14px
        base: '1rem',      // 16px
        lg: '1.125rem',    // 18px
        xl: '1.25rem',     // 20px
        '2xl': '1.5rem',   // 24px
        '3xl': '1.875rem', // 30px
        '4xl': '2.25rem',  // 36px
    },
    fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
    },
} as const;

export const SPACING = {
    xs: '0.5rem',    // 8px
    sm: '1rem',      // 16px
    md: '1.5rem',    // 24px
    lg: '2rem',      // 32px
    xl: '3rem',      // 48px
    '2xl': '4rem',   // 64px
} as const;

export const BORDER_RADIUS = {
    sm: '0.375rem',   // 6px
    md: '0.5rem',     // 8px
    lg: '0.75rem',    // 12px
    xl: '1rem',       // 16px
    '2xl': '1.5rem',  // 24px
    full: '9999px',
} as const;

export const SHADOWS = {
    card: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    cardHover: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
} as const;

export const ANIMATIONS = {
    duration: {
        fast: '150ms',
        normal: '300ms',
        slow: '500ms',
    },
    easing: {
        easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
        easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
        easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
} as const;

// Layout constants
export const LAYOUT = {
    sidebarWidth: '240px',
    headerHeight: '64px',
    maxContentWidth: '1440px',
} as const;

// Accessibility
export const A11Y = {
    minTouchTarget: '44px',
    focusRingWidth: '2px',
    focusRingOffset: '2px',
} as const;
