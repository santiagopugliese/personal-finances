// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  // en dev no registramos SW (igual no te hace falta PWA en dev)
  disable: process.env.NODE_ENV === 'development',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // NO uses experimental.appDir en Next 15
}

module.exports = withPWA(nextConfig)
