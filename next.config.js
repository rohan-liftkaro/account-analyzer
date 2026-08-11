/** @type {import('next').Config} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['exceljs', 'csv-parser', 'fast-csv'],
  },
};

module.exports = nextConfig;
