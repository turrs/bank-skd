// Route configuration and fallback logic
export const ROUTES = {
  // Public routes
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  
  // User routes
  DASHBOARD: '/dashboard',
  HISTORY: '/history',
  TRYOUT: '/tryout',
  PAYMENT: '/payment',
  REVIEW: '/review',
  
  // Admin routes
  ADMIN: '/admin',
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_QUESTIONS: '/admin/questions',
  ADMIN_PACKAGE_STATS: '/admin/package-stats',
  
  // Dynamic routes
  TRYOUT_PACKAGE: (packageId: string) => `/tryout/${packageId}`,
  PAYMENT_PACKAGE: (packageId: string) => `/payment/${packageId}`,
  REVIEW_SESSION: (sessionId: string) => `/review/${sessionId}`,
  ADMIN_QUESTIONS_PACKAGE: (packageId: string) => `/admin/questions/${packageId}`,
  ADMIN_PACKAGE_STATS_PACKAGE: (packageId: string) => `/admin/package-stats/${packageId}`,
} as const;

// Route fallback mapping
export const ROUTE_FALLBACKS = {
  // Short routes redirect to full routes
  '/admin': '/admin/dashboard',
  '/question': '/admin/questions',
  '/tryout': '/dashboard',
  '/payment': '/dashboard',
  '/history': '/dashboard',
  '/review': '/dashboard',
  
  // Admin shortcuts
  '/admin/questions': '/admin/dashboard',
  '/admin/stats': '/admin/dashboard',
  '/admin/users': '/admin/dashboard',
  
  // Common typos
  '/dashbord': '/dashboard',
  '/dash': '/dashboard',
  '/home': '/',
  '/landing': '/',
  '/main': '/',
  
  // API routes (should not redirect)
  '/api': null,
  '/api/midtrans': null,
} as const;

// Check if route should redirect
export const shouldRedirect = (path: string): string | null => {
  return ROUTE_FALLBACKS[path as keyof typeof ROUTE_FALLBACKS] || null;
};

// Get fallback route based on user status
export const getFallbackRoute = (isAuthenticated: boolean, isAdmin: boolean = false): string => {
  if (isAuthenticated) {
    if (isAdmin) {
      return ROUTES.ADMIN_DASHBOARD;
    }
    return ROUTES.DASHBOARD;
  }
  return ROUTES.HOME;
};

// Route validation
export const isValidRoute = (path: string): boolean => {
  const validRoutes = Object.values(ROUTES).filter(route => typeof route === 'string');
  return validRoutes.includes(path as any);
};

// Get route category
export const getRouteCategory = (path: string): 'public' | 'user' | 'admin' | 'dynamic' => {
  if (path === '/' || path === '/login' || path === '/register') {
    return 'public';
  }
  
  if (path.startsWith('/admin')) {
    return 'admin';
  }
  
  if (path.includes(':')) {
    return 'dynamic';
  }
  
  return 'user';
};
