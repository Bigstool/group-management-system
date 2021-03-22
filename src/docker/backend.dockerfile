FROM python:3-alpine

WORKDIR /usr/src/app/

COPY ./backend/requirements.txt ./

# dependencies
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories && \
    apk update && \
    apk add musl-dev libffi-dev openssl-dev libev-dev gcc && \
    pip install --no-cache-dir -r requirements.txt

COPY ./backend/app/ ./backend/config/app_config.prod.yml ./backend/config/jwt/jwt.prod.key ./backend/config/jwt/jwt.prod.key.pub ./

EXPOSE 8080

ENV ENV="PROD"

CMD [ "python", "./main.py" ]
