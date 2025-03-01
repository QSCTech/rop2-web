# 构建阶段
FROM node:latest AS build-stage
WORKDIR /app
COPY ./package*.json ./
COPY ./.npmrc ./
RUN npm install
COPY . .
ENV VITE_IS_DOCKER_ENVIRONMENT=true
ENV VITE_ENABLE_RUNTIME_CONFIG=true
RUN npm run build

# 发布阶段
FROM nginx:stable-alpine AS production-stage
COPY --from=build-stage /app/dist /usr/share/nginx/html
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

COPY ./main.sh .
RUN chmod a+x ./main.sh
# 允许通过环境变量设置后端URL
ENV APIBASE=http://127.0.0.1:8080

EXPOSE 80

CMD ["sh", "main.sh"]
