FROM python:3-alpine

WORKDIR /usr/src/app/

COPY ./backend/Pipfile ./

# dependencies
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories && \
    apk update && \
    apk add musl-dev libffi-dev openssl-dev libev-dev gcc && \
    pip install --no-cache-dir pipenv && \
    CI=1 pipenv lock && \
    CI=1 pipenv install --system --deploy

COPY ./backend/app/ ./backend/config/app_config.yml ./backend/config/jwt/jwt.key ./backend/config/jwt/jwt.key.pub ./

EXPOSE 8080

CMD [ "python", "./main.py" ]
