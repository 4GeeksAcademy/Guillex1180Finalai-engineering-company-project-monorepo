const path = require('node:path');

/** @type {import('next').NextConfig} */
const nextConfig = {
	turbopack: {
		root: path.resolve(__dirname, '../..'),
	},
	async rewrites() {
		return [
			{
				source: '/trackflow-api/:path*',
				destination: `${(process.env.TRACKFLOW_API_URL || process.env.NEXT_TRACKFLOW_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '')}/:path*`,
			},
		];
	},
};

module.exports = nextConfig;
