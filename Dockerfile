FROM node:5.10.1-slim
ADD . /app
WORKDIR /app
ENV NODE_ENV=production
RUN npm install --production && npm cache clean
EXPOSE 3000
CMD ["npm", "start"]
