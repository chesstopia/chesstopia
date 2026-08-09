# Single-stage artifact-copy image: the pre-built Vite dist/ is produced by the
# pipeline (pnpm build) and served by nginx with an SPA fallback. No node build
# runs inside this Docker layer.
FROM nginx:alpine
COPY dist/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
