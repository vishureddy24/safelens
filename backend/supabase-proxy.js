import express from "express";
import cors from "cors";
import { createProxyMiddleware } from "http-proxy-middleware";

const app = express();
const PORT = 4000;

// ✅ Allow CORS for your frontend (adjust port if you're using Vite: 5173, Next.js: 3000, etc.)
app.use(
  cors({
    origin: [
      "http://localhost:5173", // Vite default
      "http://127.0.0.1:5173",
      "http://localhost:3000", // Next.js / React default
      "http://127.0.0.1:3000",
    ],
    credentials: true,
  })
);

// ✅ Proxy all API calls to Supabase
app.use(
  "/supabase",
  createProxyMiddleware({
    target: "https://wbqydwbbmepihqdsfahg.supabase.co",
    changeOrigin: true,
    pathRewrite: {
      "^/supabase": "", // removes the /supabase prefix
    },
    secure: true,
  })
);

app.listen(PORT, () => {
  console.log(`🚀 Supabase proxy running at http://localhost:${PORT}`);
});
