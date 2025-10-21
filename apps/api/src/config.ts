export const getAllowedOrigins = () => {
  const origins = ["http://localhost:3000"]; // You're Next.js app

  if (process.env.NODE_ENV === "production") {
    origins.push("https://a0.run");
  }

  return origins;
};
