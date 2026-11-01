/** @type {import('next').NextConfig} */
module.exports = {
  // Database drivers used by the lab connector run only on the server.
  experimental: { serverComponentsExternalPackages: ["mysql2", "mssql"] },
};
