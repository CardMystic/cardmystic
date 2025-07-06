FROM mcr.microsoft.com/devcontainers/typescript-node:1-22-bookworm

WORKDIR /workspaces/cardmystic-frontend
ENV PNPM_HOME=/workspaces/pnpm
RUN corepack enable pnpm

COPY pnpm-lock.yaml ./

# pre-loads required packages from pnpm-lock.yaml into the store,
# ready to be installed with `pnpm install`
RUN pnpm fetch
