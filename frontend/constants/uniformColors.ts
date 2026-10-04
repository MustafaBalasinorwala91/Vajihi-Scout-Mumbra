// ============================================
// Uniform Design System
// ============================================

export const UniformColors = {
    // ===========================
    // Primary Theme
    // ===========================

    primary: '#5B3DF5',
    primaryDark: '#2B145A',
    primaryLight: '#EEE7FF',

    secondary: '#7B4DFF',

    background: '#F6F4FF',

    white: '#FFFFFF',

    black: '#16162E',

    text: '#16162E',

    textSecondary: '#666666',

    textLight: '#999999',

    border: '#ECECEC',

    divider: '#F1F1F1',

    card: '#FFFFFF',

    // ===========================
    // Status
    // ===========================

    success: '#22C55E',

    successBg: '#E8FFF1',

    warning: '#F59E0B',

    warningBg: '#FFF4E5',

    danger: '#EF4444',

    dangerBg: '#FFE8E8',

    info: '#3B82F6',

    infoBg: '#E8F2FF',

    repair: '#8B5CF6',

    repairBg: '#F2E8FF',

    // ===========================
    // Stock
    // ===========================

    inStock: '#22C55E',

    lowStock: '#F59E0B',

    outOfStock: '#EF4444',

    // ===========================
    // Assignment
    // ===========================

    assigned: '#3B82F6',

    returned: '#22C55E',

    damaged: '#EF4444',

    lost: '#991B1B',

    pending: '#F59E0B',

    // ===========================
    // Categories
    // ===========================

    upperBody: '#4F46E5',

    lowerBody: '#2563EB',

    footwear: '#0891B2',

    accessories: '#9333EA',

    head: '#EA580C',

    // ===========================
    // Shadows
    // ===========================

    shadow: '#000000',

    overlay: 'rgba(0,0,0,0.45)',
};

// ============================================
// Gradient
// ============================================

export const UniformGradients = {
    header: ["#2B145A", "#5B3DF5"] as const,

    primary: ["#7B4DFF", "#4B1DFF"] as const,

    success: ["#34D399", "#22C55E"] as const,

    warning: ["#FDBA74", "#F59E0B"] as const,

    danger: ["#F87171", "#EF4444"] as const,

    info: ["#60A5FA", "#2563EB"] as const,
};

// ============================================
// Radius
// ============================================

export const Radius = {
    xs: 8,

    sm: 12,

    md: 16,

    lg: 22,

    xl: 28,

    xxl: 36,

    full: 999,
};

// ============================================
// Spacing
// ============================================

export const Spacing = {
    xs: 4,

    sm: 8,

    md: 12,

    lg: 16,

    xl: 20,

    xxl: 24,

    xxxl: 32,
};

// ============================================
// Font Sizes
// ============================================

export const FontSizes = {
    xs: 11,

    sm: 13,

    md: 15,

    lg: 17,

    xl: 22,

    xxl: 28,

    title: 34,
};

// ============================================
// Elevation
// ============================================

export const Elevation = {
    low: 2,

    medium: 5,

    high: 10,

    floating: 15,
};

// ============================================
// Status Colors
// ============================================

export const StatusColors = {
    assigned: UniformColors.assigned,

    returned: UniformColors.returned,

    repair: UniformColors.repair,

    damaged: UniformColors.damaged,

    lost: UniformColors.lost,

    pending: UniformColors.pending,
};

// ============================================
// Stock Colors
// ============================================

export const StockColors = {
    healthy: UniformColors.success,

    low: UniformColors.warning,

    empty: UniformColors.danger,
};

// ============================================
// Category Icons
// ============================================

export const CategoryIcons = {
    Head: 'shield',

    'Upper Body': 'shirt',

    'Lower Body': 'walk',

    Footwear: 'footsteps',

    Accessories: 'briefcase',
};

// ============================================
// Uniform Status Labels
// ============================================

export const UniformStatus = {
    ASSIGNED: 'assigned',

    RETURNED: 'returned',

    REPAIR: 'repair',

    LOST: 'lost',

    DAMAGED: 'damaged',
};

// ============================================
// Repair Status
// ============================================

export const RepairStatus = {
    PENDING: 'pending',

    IN_PROGRESS: 'in_progress',

    COMPLETED: 'completed',
};

// ============================================
// Stock Labels
// ============================================

export const StockLabels = {
    HEALTHY: 'Healthy',

    LOW: 'Low Stock',

    EMPTY: 'Out of Stock',
};