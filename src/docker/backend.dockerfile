FROM python:3-alpine

WORKDIR /usr/src/app/

COPY ./backend/Pipfile ./

# dependencies
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories && \
    apk update && \
    apk add musl-dev libffi-dev openssl-dev libev-dev gcc && \
    pip install --no-cache-dir pipenv && \
    pipenv install

COPY ./backend/app/ ./backend/config/app_config.yml ./backend/config/jwt/jwt.key ./backend/config/jwt/jwt.key.pub ./

EXPOSE 8080

CMD [ "python", "./main.py" ]
