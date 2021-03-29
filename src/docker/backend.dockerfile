FROM python:3

WORKDIR /usr/src/app/

COPY ./backend/Pipfile ./

# dependencies
RUN sed -i "s@http://deb.debian.org@http://mirrors.aliyun.com@g" /etc/apt/sources.list && \
    apt update && \
    apt install -y libev-dev && \
    pip install -i https://pypi.tuna.tsinghua.edu.cn/simple --no-cache-dir pipenv && \
    CI=1 pipenv lock && \
    CI=1 pipenv install --system --deploy

COPY ./backend/app/ ./backend/config/ ./

EXPOSE 8080

CMD [ "python", "./main.py" ]
