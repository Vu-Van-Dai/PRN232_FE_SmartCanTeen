// BE handles VNPAY callback via GET /api/vnpay/ipn (server-to-server).
// FE typically doesn't call this, but keeping the path here for completeness.

export const vnpayIpnPath = "/api/vnpay/ipn";
