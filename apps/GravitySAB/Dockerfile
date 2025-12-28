FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat git
WORKDIR /app

# Build args for Vite
ARG VITE_API_URL
ARG VITE_WEBSOCKET_URL
ARG VITE_AUTH_ISSUER
ARG VITE_AUTH_CLIENT_ID
ARG VITE_AUTH_AUDIENCE
ARG VITE_CONTACT_FLOW_ID
ARG VITE_INSTANCE_ID
ARG VITE_API_GATEWAY_ENDPOINT
ARG VITE_CONNECT_REGION
ARG VITE_APS_CUSTOMER_ENDPOINT
ARG VITE_CLOUDFRONT_ENDPOINT
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WEBSOCKET_URL=$VITE_WEBSOCKET_URL
ENV VITE_AUTH_ISSUER=$VITE_AUTH_ISSUER
ENV VITE_AUTH_CLIENT_ID=$VITE_AUTH_CLIENT_ID
ENV VITE_AUTH_AUDIENCE=$VITE_AUTH_AUDIENCE
ENV VITE_CONTACT_FLOW_ID=$VITE_CONTACT_FLOW_ID
ENV VITE_INSTANCE_ID=$VITE_INSTANCE_ID
ENV VITE_API_GATEWAY_ENDPOINT=$VITE_API_GATEWAY_ENDPOINT
ENV VITE_CONNECT_REGION=$VITE_CONNECT_REGION
ENV VITE_APS_CUSTOMER_ENDPOINT=$VITE_APS_CUSTOMER_ENDPOINT
ENV VITE_CLOUDFRONT_ENDPOINT=$VITE_CLOUDFRONT_ENDPOINT

# Copy gravity-client package first (SAB depends on it)
COPY packages/gravity-client/ ./packages/gravity-client/

# Build gravity-client
WORKDIR /app/packages/gravity-client
RUN npm install
RUN npm run build

# Copy and build SAB
WORKDIR /app/apps/GravitySAB
COPY apps/GravitySAB/package.json ./
RUN npm install
COPY apps/GravitySAB/ ./
RUN npm run build

# Production stage
FROM nginx:alpine AS runner
COPY --from=builder /app/apps/GravitySAB/dist /usr/share/nginx/html
RUN echo 'server { listen 80; location / { root /usr/share/nginx/html; index index.html; try_files $uri $uri/ /index.html; } }' > /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
