// ==============================
// Uniform Catalog
// ==============================

export interface UniformCatalog {
    catalog_id: string;
    name: string;
    category: string;
    description?: string;
    available_sizes: string[];
    image?: string;
    is_mandatory: boolean;
    display_order: number;
    created_at?: string;
    updated_at?: string;
}

// ==============================
// Uniform Inventory
// ==============================

export interface UniformInventory {
    inventory_id: string;
    catalog_id: string;

    catalog_name?: string;
    category?: string;
    description?: string;
    image?: string;
    is_mandatory?: boolean;

    size: string;

    total_quantity: number;
    available_quantity: number;
    assigned_quantity: number;
    repair_quantity: number;
    damaged_quantity: number;

    minimum_stock: number;

    purchase_price: number;
    supplier?: string;
    purchase_date?: string;

    notes?: string;

    created_by?: string;
    created_at?: string;
    updated_at?: string;
}

// ==============================
// Member Assignment
// ==============================

export interface MemberUniform {
    assignment_id: string;

    user_id: string;
    inventory_id: string;
    catalog_id: string;

    quantity: number;

    status:
    | "assigned"
    | "returned"
    | "repair"
    | "lost"
    | "damaged";

    condition_given: string;
    condition_returned?: string;

    assigned_date: string;
    return_date?: string;

    member_notes?: string;
    remarks?: string;

    assigned_by?: string;

    created_at?: string;
    updated_at?: string;
}

// ==============================
// Repair
// ==============================

export interface UniformRepair {
    repair_id: string;

    assignment_id: string;

    inventory_id: string;

    user_id: string;

    issue: string;

    priority:
    | "Low"
    | "Medium"
    | "High";

    status:
    | "pending"
    | "in_progress"
    | "completed";

    notes?: string;

    repair_cost?: number;

    created_by?: string;

    completed_by?: string;

    completed_date?: string;

    created_at?: string;
}

// ==============================
// Purchase
// ==============================

export interface UniformPurchase {
    purchase_id: string;

    catalog_id: string;

    size: string;

    quantity: number;

    unit_price: number;

    total_price: number;

    supplier?: string;

    invoice_number?: string;

    invoice_image?: string;

    purchase_date: string;

    notes?: string;

    purchased_by?: string;

    created_at?: string;
}

// ==============================
// Dashboard Summary
// ==============================

export interface UniformDashboardSummary {
    inventory_items: number;

    total_stock: number;

    available_stock: number;

    assigned_stock: number;

    repair_stock: number;

    damaged_stock: number;

    inventory_value: number;

    purchase_cost: number;

    repair_cost: number;

    pending_repairs: number;

    completed_repairs: number;

    assignments: number;
}

export interface LowStockItem {
    inventory_id: string;

    uniform_name: string;

    size: string;

    available: number;

    minimum: number;
}

export interface OutOfStockItem {
    inventory_id: string;

    uniform_name: string;

    size: string;
}

export interface UniformDashboard {
    summary: UniformDashboardSummary;

    alerts: {
        low_stock: LowStockItem[];

        out_of_stock: OutOfStockItem[];
    };
}

// ==============================
// Member
// ==============================

export interface UniformMember {
    user_id: string;

    name: string;

    its_no?: string;

    picture?: string;

    instrument?: string;
}

// ==============================
// API Response
// ==============================

export interface ApiResponse<T> {
    success: boolean;

    data: T;

    message?: string;
}

// ==============================
// Filters
// ==============================

export interface UniformFilters {
    search: string;

    category: string;

    size: string;

    status: string;
}