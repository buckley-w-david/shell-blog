FROM python:3.10-slim

RUN apt-get update && \
    apt-get install -y build-essential curl git pandoc chromium && \
    curl -fsSL https://deb.nodesource.com/setup_19.x | bash - && \
    apt-get install -y nodejs

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

COPY pyproject.toml poetry.lock ./

RUN curl -sSL https://install.python-poetry.org | python3 - && \
    /root/.local/bin/poetry config virtualenvs.create false && \
    /root/.local/bin/poetry install --no-interaction --no-ansi && \
    npm install -g --save-exact esbuild mermaid-filter --unsafe-perm

RUN echo '{"args": ["--no-sandbox","--disable-setuid-sandbox"],"executablePath": "/usr/bin/chromium"}' > /tmp/.puppeteer.json
RUN printf '#!/bin/sh\ncp /tmp/.puppeteer.json . && make -B' > /tmp/build.sh && chmod +x /tmp/build.sh
ENV PATH="${PATH}:/root/.local/bin:/app/node_modules/.bin"

CMD ["/tmp/build.sh"]
