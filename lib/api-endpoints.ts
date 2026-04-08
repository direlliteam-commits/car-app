export const API = {
  auth: {
    me: "/api/auth/me",
    login: "/api/auth/login",
    register: "/api/auth/register",
    logout: "/api/auth/logout",
    google: "/api/auth/google",
    profile: "/api/auth/profile",
    avatar: "/api/auth/avatar",
    changePassword: "/api/auth/change-password",
    forgotPassword: "/api/auth/forgot-password",
    resetPassword: "/api/auth/reset-password",
    tokenRefresh: "/api/auth/token/refresh",
    listingLimits: "/api/auth/listing-limits",
    purchaseListingSlot: "/api/auth/purchase-listing-slot",
    showroomPhoto: "/api/auth/showroom-photo",
    branchPhoto: "/api/auth/branch-photo",
    deleteAccount: "/api/auth/account",
    dealerImage: (type: string) => `/api/auth/dealer-image?type=${type}` as const,
    phone: {
      sendCode: "/api/auth/phone/send-code",
      verifyCode: "/api/auth/phone/verify-code",
      confirmIdentity: "/api/auth/phone/confirm-identity",
      disownAccount: "/api/auth/phone/disown-account",
    },
  },

  listings: {
    list: "/api/listings",
    my: "/api/my/listings",
    byIds: "/api/listings/by-ids",
    catalog: "/api/listings/catalog",
    getById: (id: string | number) => `/api/listings/${id}` as const,
    similar: (id: string | number) => `/api/listings/${id}/similar?limit=22` as const,
    priceHistory: (id: string | number) => `/api/listings/${id}/price-history` as const,
    bump: (id: string | number) => `/api/listings/${id}/bump` as const,
    bumpInfo: (id: string | number) => `/api/listings/${id}/bump-info` as const,
    count: "/api/listings/count",
  },

  catalog: {
    sections: "/api/catalog/sections",
  },

  brands: {
    list: "/api/brands",
    models: (brandId: number) => `/api/brands/${brandId}/models` as const,
  },

  models: {
    list: "/api/models",
  },

  generations: {
    list: "/api/generations",
  },

  configurations: {
    list: "/api/configurations",
  },

  specs: {
    lookup: "/api/specs/lookup",
  },

  conversations: {
    list: "/api/conversations",
    create: "/api/conversations",
    getById: (id: string | number) => `/api/conversations/${id}` as const,
    messages: (id: string | number) => `/api/conversations/${id}/messages` as const,
    sendImage: (id: string | number) => `/api/conversations/${id}/send-image` as const,
    shareVin: (id: string | number) => `/api/conversations/${id}/share-vin` as const,
    typing: (id: string | number) => `/api/conversations/${id}/typing` as const,
  },

  favorites: {
    list: "/api/favorites",
    toggle: (id: string | number) => `/api/favorites/${id}` as const,
  },

  users: {
    getById: (id: string) => `/api/users/${id}` as const,
    reviews: (id: string) => `/api/users/${id}/reviews` as const,
    block: (id: string) => `/api/users/${id}/block` as const,
    blocked: (id: string) => `/api/users/${id}/blocked` as const,
  },

  blockedUsers: "/api/blocked-users",
  unreadCount: "/api/unread-count",
  typingStatus: "/api/typing-status",

  notifications: {
    list: "/api/notifications",
    unreadCount: "/api/notifications/unread-count",
    readAll: "/api/notifications/read-all",
    markRead: (id: number) => `/api/notifications/${id}/read` as const,
  },

  reports: "/api/reports",

  wallet: {
    balance: "/api/wallet",
    topup: "/api/wallet/topup",
  },

  transactions: "/api/transactions",

  exchangeRates: "/api/exchange-rates",

  stories: "/api/stories",

  recommendations: "/api/recommendations",
  recentlyViewed: "/api/recently-viewed",

  upload: "/api/upload",
  uploadVideo: "/api/upload-video",

  analytics: {
    price: "/api/analytics/price",
    priceByYear: "/api/analytics/price-by-year",
    priceDistribution: "/api/analytics/price-distribution",
    priceEvaluation: "/api/analytics/price-evaluation",
    topBrands: "/api/analytics/top-brands",
    topModels: (brand: string) => `/api/analytics/top-models?brand=${encodeURIComponent(brand)}` as const,
    market: "/api/analytics/market",
    dealer: "/api/analytics/dealer",
    pro: "/api/analytics/pro",
  },

  promotions: {
    list: "/api/promotions",
    my: "/api/promotions/my",
    purchase: "/api/promotions/purchase",
    dealerQuota: "/api/promotions/dealer-quota",
    forListing: (listingId: string | number) => `/api/promotions/listing/${listingId}` as const,
  },

  promotionPackages: "/api/promotion-packages",

  bumpSettings: "/api/bump-settings",

  journal: {
    create: "/api/journal",
    update: (id: string | number) => `/api/journal/${id}` as const,
    feed: "/api/journal-feed",
    getById: (id: string | number) => `/api/journal/${id}` as const,
    postDetail: (id: string | number) => `/api/journal-post/${id}` as const,
    comments: (id: string | number) => `/api/journal/${id}/comments` as const,
    like: (id: string | number) => `/api/journal/${id}/like` as const,
    view: (id: string | number) => `/api/journal/${id}/view` as const,
    userPosts: (userId: string) => `/api/journal/${userId}` as const,
    follow: (id: string) => `/api/journal/follow/${id}` as const,
    followStats: (id: string) => `/api/journal/follow-stats/${id}` as const,
  },

  modelRating: "/api/model-rating",
  modelRatingsBulk: "/api/model-ratings/bulk",
  modelReviews: "/api/model-reviews",

  reviews: "/api/reviews",

  savedSearches: {
    list: "/api/saved-searches",
    delete: (id: string | number) => `/api/saved-searches/${id}` as const,
    notifications: (id: string | number) => `/api/saved-searches/${id}/notifications` as const,
  },

  priceAlerts: {
    list: "/api/price-alerts",
    forListing: (id: string | number) => `/api/price-alerts/listing/${id}` as const,
    delete: (alertId: string | number) => `/api/price-alerts/${alertId}` as const,
  },

  dealer: {
    info: "/api/dealer",
    myFeatures: "/api/dealer/my-features",
    photoLimit: "/api/dealer/photo-limit",
    autoRenew: "/api/dealer/auto-renew",
    renew: "/api/dealer/renew",
  },

  dealerRequests: {
    list: "/api/dealer-requests",
    my: "/api/dealer-requests/my",
    selectPlan: "/api/dealer-requests/select-plan",
    activate: "/api/dealer-requests/activate",
    uploadLogo: "/api/dealer-requests/upload-logo",
    uploadDocument: "/api/dealer-requests/upload-document",
  },

  dealerPlans: "/api/dealer-plans",

  proSeller: {
    status: "/api/pro-seller/status",
    purchase: "/api/pro-seller/purchase",
    renew: "/api/pro-seller/renew",
    autoRenew: "/api/pro-seller/auto-renew",
  },

  credit: {
    banks: "/api/credit/banks",
    apply: "/api/credit/apply",
    estimate: "/api/credit/estimate",
    applications: "/api/credit/applications",
    getApplication: (id: string | number) => `/api/credit/applications/${id}` as const,
  },

  callback: {
    request: "/api/callback/request",
    requests: "/api/callback/requests",
    getById: (id: string | number) => `/api/callback/requests/${id}` as const,
  },

  support: {
    chat: "/api/support/chat",
    chatSend: "/api/support/chat/send",
    chatSendImage: "/api/support/chat/send-image",
    chatTyping: "/api/support/chat/typing",
    chatTypingStatus: "/api/support/chat/typing-status",
    tickets: "/api/support/tickets",
    ticketMessages: (id: string | number) => `/api/support/tickets/${id}/messages` as const,
    unreadCount: "/api/support/unread-count",
  },

  serviceInterests: {
    list: "/api/service-interests",
    toggle: (key: string) => `/api/service-interests/${key}` as const,
  },

  seller: {
    stats: "/api/seller/stats",
    listingStats: "/api/seller/listing-stats",
  },

  drafts: {
    list: "/api/drafts",
    create: "/api/drafts",
    update: (serverId: string | number) => `/api/drafts/${serverId}` as const,
    delete: (serverId: string | number) => `/api/drafts/${serverId}` as const,
  },

  pushTokens: "/api/push-tokens",

  admin: {
    stats: "/api/admin/stats",
    listings: "/api/admin/listings",
    listingDetail: (id: number) => `/api/admin/listings/${id}` as const,
    moderateListing: (id: number) => `/api/admin/listings/${id}/moderate` as const,
    users: "/api/admin/users",
    userRole: (userId: string) => `/api/admin/users/${userId}/role` as const,
    reports: "/api/admin/reports",
    updateReport: (id: number) => `/api/admin/reports/${id}` as const,
    dealerRequests: "/api/admin/dealer-requests",
    updateDealerRequest: (id: number) => `/api/admin/dealer-requests/${id}` as const,
    conversations: {
      between: "/api/admin/conversations/between",
      messages: (convId: number) => `/api/admin/conversations/${convId}/messages?limit=100` as const,
    },
    support: "/api/admin/support",
    analytics: "/api/admin/analytics",
  },
} as const;
