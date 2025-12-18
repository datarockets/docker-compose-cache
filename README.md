# Docker Compose Cache Action

Enables caching of docker compose volumes and images across builds.

## Why?

We use docker compose heavily in our dev environments. Usually, in development, we have an image with an interpreter (e.g. Ruby or Node.js) and necessary system dependencies (e.g. CA certificates or SSL libraries) and install app dependencies (gems or npm packages) separately during the setup.

On macOS, bind mount volumes are painfully slow, especially when we do a lot of small writes or a lot of different file reads. So we usually use docker volumes for folders with app dependencies (e.g. `vendor/bundle` or `node_modules`).

```yml
# compose.yml

services:
  app:
    build:
      context: .
    volumes:
      - .:/home/app/app
      - vendor_bundle:/home/app/app/vendor/bundle
      - node_modules:/home/app/app/node_modules
    command: bin/dev
    ports:
      - 3000:3000

volumes:
  vendor_bundle:
  node_modules:
```

In addition to dockerized environment, we have `bin/setup` scripts in our projects that setup dev environment so the app is ready to work with. Usually it looks something like this:

```bash
# bin/setup

docker compose build
bin/npm install
bin/bundle install
bin/rails db:prepare
```

Ideally, on GitHub Actions, we want to just run `bin/setup` and then `bin/lint` and `bin/test`, without repeating setup steps and configuring dependencies such us database.

As a side-effect, we would test `bin/setup` script on CI and make sure new developers onboarding to the project wouldn't have additional troubles.

GitHub Actions start a fresh VM for every run and it makes `bin/setup` to build images and install dependencies from scratch which is slow.

We want to cache image layers and volumes with dependencies.

## Usage

```yml
steps:
  - uses: actions/checkout@v4
  - uses: docker/setup-buildx-action@v3
  - uses: datarockets/docker-compose-cache@v1
    with:
      volumes: |
        node_modules: ${{ hashFiles('package-lock.json') }}
  - run: bin/setup
```

In order to cache image layers, you would need to set `cache_from` and `cache_to` in build section for your service. It's recommended to create a separate `compose.ci.yml` and use it conditionally depending on whether `CI` env variable is set:

```yml
# compose.ci.yml

services:
  app:
    build:
      cache_from:
        - type=gha
      cache_to:
        - type=gha,mode=max
```

```bash
# bin/setup

if [[ -n "${CI}" ]]; then
	export COMPOSE_FILE="compose.yml:compose.ci.yml"
fi

docker compose build
# ...
```
