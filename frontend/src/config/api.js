// API Configuration
export const API_BASE_URL = 'http://localhost:3005';

// API Endpoints
export const API_ENDPOINTS = {
    // Suppliers
    suppliers: '/api/suppliers',

    // Clients
    clients: '/api/clients',

    // Sellers
    sellers: '/api/sellers',

    // Product Groups
    productGroups: '/api/v2/product-groups',

    // Discount Groups
    discountGroups: '/api/v2/discount-groups',

    // Auxiliary
    cities: '/api/aux/cidades',
    areas: '/api/aux/areas',
    regions: '/api/aux/regioes',
    transportadoras: '/api/transportadoras',

    // Import
    importSuppliers: '/api/import/suppliers',
    importSuppliersXlsx: '/api/import/suppliers-xlsx',

    // Database
    firebirdTest: '/api/firebird/test',
    postgresTest: '/api/postgres/test'
};

// Helper function to build full URL
export const buildApiUrl = (endpoint, params = '') => {
    return `${API_BASE_URL}${endpoint}${params}`;
};
