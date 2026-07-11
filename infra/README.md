# Chesstopia Infrastructure (Ansible)

Provisioning for the Hetzner VPS. Runs **locally** from a laptop (Ansible is
agentless — no Ansible server). See `docs/adr/0010-deployment-cicd-infrastruktur.md`
for the topology and `docs/adr/0011-migration-nach-github-actions.md` for what the
move to GitHub changed.

## Topology

| Host       | Spec         | Role                                     |
|------------|--------------|------------------------------------------|
| `prod-app` | 4 GB / 2 CPU | App: Caddy, backend, frontend, Postgres  |

One box. CI runs on GitHub-hosted runners, images live in **GHCR**
(`ghcr.io/chesstopia/…`, public packages, pulled anonymously over HTTPS). The former
infra box — self-hosted runner plus a plain-HTTP `registry:2` on the Hetzner private
network — is gone, and with it the `registry`, `deploy_key` and `infra_compose` roles.

Ansible **provisions** the box and owns the persistent stacks (`db`, `edge`).
GitHub Actions **deploys** the stateless app stack (`.github/workflows/deploy.yml`).

## Layout

```
infra/
├── ansible.cfg
├── requirements.yml          # galaxy collections
├── bootstrap.yml             # first contact with a FRESH box (as root)
├── site.yml                  # ongoing convergence (as admin user)
├── inventory/hosts.yml
├── group_vars/
│   ├── all.yml               # admins, deploy user + keys, swap, firewall, registry
│   └── prod/{vars.yml,vault.yml}
└── roles/{common,users,ssh_hardening,docker,deploy_target,db,edge}
```

## One-time setup

```bash
cd infra
ansible-galaxy collection install -r requirements.yml
```

`group_vars/prod/vault.yml` is committed **encrypted** (Ansible Vault, AES256). The
passphrase lives in your password manager and nowhere else. Edit with
`ansible-vault edit group_vars/prod/vault.yml`.

## Converging

```bash
ansible-playbook site.yml --ask-vault-pass
```

`--ask-vault-pass` is needed because `deploy_target` renders the app `.env` from
`vault.yml`. Admins have passwordless sudo, so no become password is required.

## Wiring up the GitHub deploy workflow

The deploy workflow SSHes into prod as the unprivileged `deploy` user. Three things
have to line up — do this **before** the first deploy, or `compose pull` will fail.

**1. Deploy keypair** — generate it once, locally:

```bash
ssh-keygen -t ed25519 -C "deploy@github-actions" -f ~/.ssh/chesstopia_deploy -N ""
```

- Public half → `deploy_ssh_keys` in `group_vars/all.yml` (replaces the `CHANGE_ME`
  entry). The `users` role authorises it on prod.
- Private half → GitHub → repo Settings → Environments → **`production`** →
  *Environment secrets* → `DEPLOY_SSH_KEY`.

Put it on the **environment**, not on the repository: an environment secret with a
`main` deployment-branch rule cannot be read by a workflow on a feature branch, and
never by a fork PR. Note what this key is worth — `deploy` is in the `docker` group,
which is root-equivalent on this box. **Repo write access ≈ prod root.**

**2. Host-key pin** — a `site.yml` run writes `infra/prod_known_hosts` (gitignored)
by reading prod's own host key over the already-trusted Ansible connection. Paste its
contents into GitHub → Settings → *Variables* → `PROD_SSH_KNOWN_HOSTS`. Not a secret;
host keys are public by design. The workflow pins against it with
`StrictHostKeyChecking=yes` — no TOFU.

**3. Host** — GitHub → Settings → *Variables* → `PROD_HOST` = prod's public IP.

## What this does NOT do

- It does **not** deploy the app — that's `.github/workflows/deploy.yml`.
- **There is no backup.** ADR-0010 planned `pg_dump` + rsync to the infra box; that
  box no longer exists and no replacement target has been chosen. The prod database
  lives on exactly one disk. Known and accepted, defensible only while there is no
  real user data. Candidate: Hetzner Storage Box + restic.

## Notes

- `arch=amd64` is hardcoded in the docker apt repo (Hetzner x86).
- The Hetzner private network has no second participant left and can be torn down.
