# ============================================================================
# tests/golden/Dockerfile
# ============================================================================
# Runtime for the golden-test runner. Not part of the pipeline (n8n/postgres)
# containers and deliberately NOT wired into the top-level docker-compose.yml
# — this exists only to give this host a Node.js + cheerio environment for
# tests/golden/run.js, since no Node.js is installed on the host machine.
#
# cheerio is installed to /opt/deps, OUTSIDE the path that gets bind-mounted
# at runtime (see run.sh: -v "$(pwd)":/repo). If cheerio were installed under
# /repo/tests/golden/node_modules instead, the runtime bind mount would shadow
# it with the host's actual (dependency-free) tests/golden directory. NODE_PATH
# makes `require('cheerio')` resolve from /opt/deps regardless of what's
# mounted over /repo. Verified empirically before committing to this design
# (see decision_log.md).
# ============================================================================
FROM node:24-alpine

COPY package.json /opt/deps/package.json
RUN cd /opt/deps && npm install --omit=dev

ENV NODE_PATH=/opt/deps/node_modules

WORKDIR /repo
CMD ["node", "tests/golden/run.js"]
