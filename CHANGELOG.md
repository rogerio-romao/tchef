# Changelog

## v0.5.0

### 🚀 Enhancements

- Add Content-Type header auto-detection for request bodies ([#99](https://github.com/rogerio-romao/tchef/pull/99))

### 📖 Documentation

- Update README

### 📦 Build

- Add oxlint and oxfmt, replace ESLint
- Add pnpm workspace configuration
- Add JSR publish workflow ([#67](https://github.com/rogerio-romao/tchef/pull/67))

### 🏡 Chore

- Bump typescript to v6, @types/node, json-server, vite and other deps (Dependabot)
- Fix tsconfig to enable declaration file generation ([#86](https://github.com/rogerio-romao/tchef/pull/86))
- Fix tsconfig rootDir and include src directory

### ❤️ Contributors

- Rogerio Romao ([@rogerio-romao](http://github.com/rogerio-romao))

---

## Earlier Versions (v0.0.1 – v0.3.1)

Initial development phase. Key features shipped:

- Basic HTTP methods (GET, POST, PUT, PATCH, DELETE)
- Network error handling
- Response parsing (JSON, text, blob)
- Generic typing for typed responses
- Configurable timeout with AbortController
- Retry logic with configurable delay
- Base headers generation
- Search params generation
- Schema validation on JSON responses (Standard Schema compatible)
- CI pipeline, Node version enforcement, npm publishing setup

### ❤️ Contributors

- Rogerio Romao ([@rogerio-romao](http://github.com/rogerio-romao))
