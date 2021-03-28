FROM python:3-alpine

WORKDIR /usr/src/app/

COPY ./backend/Pipfile ./

# dependencies
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories && \
    apk update && \
    apk add rust musl-dev libffi-dev openssl-dev libev-dev gcc cargo python3-dev && \
    pip install --no-cache-dir pipenv && \
    CI=1 pipenv lock && \
    CI=1 pipenv install --system --deploy

COPY ./backend/app/ ./backend/config/ ./

EXPOSE 8080

CMD [ "python", "./main.py" ]
