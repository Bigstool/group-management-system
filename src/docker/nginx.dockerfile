FROM nginx

COPY ./docker/config/cert/ /etc/ssl/nginx/

COPY ./docker/config/nginx.conf /etc/nginx/nginx.conf

COPY ./web/dist/ /usr/share/nginx/html/

EXPOSE 80 443
