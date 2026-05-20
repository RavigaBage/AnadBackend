import rateLimit from "express-rate-limit";

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,

  standardHeaders: true,
  legacyHeaders: false,

  keyGenerator: (req): string => {
    return (
      req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() ||
      req.ip ||
      req.socket.remoteAddress ||
      "unknown-ip"
    );
  },

  handler: (req, res) => {
   
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");


    return res.status(429).json({
      status: 429,
      message: "Too many requests. You are temporarily blocked for 5 minutes.",
      retryAfter: 300, 
      redirectTo: "/login"
    });
  },
});