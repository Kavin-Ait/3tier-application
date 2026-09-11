# VelTech Infrastructure Engineer Take-Home — Kavin

## Architecture

Three services, defined in a single `docker-compose.yml`:

- **web** — nginx serving a static placeholder page. Exposed publicly on port 80.
- **api** — Node.js/Express backend with two endpoints: `/health` (200 OK) and
  `/api/hello` (returns JSON). Talks to `db`.
- **db** — MongoDB, storing data in a named volume so it survives restarts.

### Networks

Two Docker bridge networks are used:

- `frontend` — `web` and `api` are attached here. This is the only network with a
  published host port (`web:80`).
- `backend` — `api` and `db` are attached here, and it's marked `internal: true`,
  so containers on it cannot reach the public internet either. `web` is **not**
  attached to this network, so it has no path to `db` at all.

This means `db` is unreachable from:
- the public internet (no `ports:` mapping is defined for `db`)
- the `web` container (not on the same network)
- the host machine directly (no port published)

Only `api` can reach `db`, over the internal `backend` network.

### Cloud firewall (defense in depth)

On top of the Docker-level isolation above, the EC2 Security Group only opens:
- Port 80 (HTTP) to `0.0.0.0/0` — for `web`
- Port 22 (SSH) restricted to my own IP only

No other port (including Mongo's `27017`) is opened at the security group level.
So even if the Docker network isolation were misconfigured, the cloud firewall
independently blocks external access to `db`.
## Assumptions made

- Used MongoDB (brief allowed either Postgres or MongoDB).
- `api`'s port is not published to the host, since the brief said this is
  optional and the stricter choice is to keep it internal-only, reachable only
  through `web` if needed later.
- Used a single EC2 instance in the default VPC/public subnet, since the whole
  stack (all 3 services) runs as containers on one host — a custom VPC/private
  subnet/NAT gateway would add complexity without adding real isolation here,
  since isolation is enforced at the Docker network + security group level.

## Trade-offs (due to the 2-hour limit)

- No HTTPS/TLS termination on `web` — plain HTTP only. With more time I'd add
  Let's Encrypt via Certbot or a reverse proxy like Traefik/Caddy.
- No automated tests for the `api` endpoints.
- No CI/CD pipeline — deployment is manual (`docker compose up -d` on the VM).
- No monitoring/logging aggregation (e.g., no centralized log shipping).

## What I'd do differently with more time

- Add TLS and a proper domain name.
- Add a CI pipeline to build/push images and redeploy automatically.
- Add basic monitoring (health checks feeding into something like Prometheus).
- Add authentication on `api` endpoints.
- Consider moving `db` to a managed service (e.g., MongoDB Atlas) for
  production use instead of a self-hosted container.

## How to run

```bash
cp .env.example .env
# edit .env with real values

docker compose up -d --build
docker ps
docker network ls

# verify db persistence
docker compose down
docker compose up -d
