# Chesstopia Infrastructure (Ansible)

Provisioning for the two Hetzner VPS. Runs **locally** from a laptop (Ansible is
agentless — no Ansible server). See `docs/adr/0010-deployment-cicd-infrastruktur.md`
for the rationale behind every choice here.

## Topology

| Host          | Spec          | Role                                          |
|---------------|---------------|-----------------------------------------------|
| `prod-app`    | 4 GB / 2 CPU  | App: Caddy, backend, frontend, Postgres       |
| `infra-build` | 8 GB / 4 CPU  | Self-hosted Bitbucket runner + registry       |

Ansible **provisions** the boxes. The Bitbucket pipeline **deploys** the app
(build → push image → `ssh deploy@prod 'docker compose pull && up -d'`).

## Layout

```
infra/
├── ansible.cfg
├── requirements.yml          # galaxy collections
├── bootstrap.yml             # first contact with a FRESH box (as root)
├── site.yml                  # ongoing convergence (as admin user)
├── inventory/hosts.yml       # <- fill in the CHANGE_ME IPs
├── group_vars/
│   ├── all.yml               # admins, deploy user, swap, firewall, registry
│   ├── prod/{vars.yml,vault.yml.example}
│   └── infra/vars.yml
└── roles/{common,users,ssh_hardening,docker,registry,deploy_key,deploy_target}
```

## One-time setup

```bash
cd infra
ansible-galaxy collection install -r requirements.yml

# Fill in inventory/hosts.yml (public + private IPs) and the SSH public keys /
# second admin in group_vars/all.yml.

# Create the encrypted secrets file:
cp group_vars/prod/vault.yml.example group_vars/prod/vault.yml
ansible-vault encrypt group_vars/prod/vault.yml   # then `ansible-vault edit` to fill in
```

## Bootstrapping

`infra-build` is fresh (root login open) → bootstrap it as root first. This creates
the admin + deploy accounts and then locks down root/password login:

```bash
ansible-playbook bootstrap.yml --limit infra -e ansible_user=root
```

`prod-app` was already bootstrapped manually (user `eyota`, root locked) → **skip
bootstrap**, just run `site.yml`. Ansible will re-assert the same SSH hardening.

## Converging (every run after bootstrap)

Admins get **passwordless sudo** (the `users` role installs a `/etc/sudoers.d`
drop-in), so no become password is needed:

```bash
ansible-playbook site.yml --ask-vault-pass
```

**First prod run only:** prod's `eyota` was created manually and still requires a
sudo password until this run installs the NOPASSWD drop-in. So the *first* time:

```bash
ansible-playbook site.yml --ask-vault-pass --ask-become-pass   # type prod eyota's password
```

After that, drop `--ask-become-pass`. The infra box never needs it (bootstrap
already set NOPASSWD there).

- `--ask-vault-pass`: needed to render the prod `.env` from `vault.yml`.

Scope to one host with `--limit prod` / `--limit infra`.

## Self-hosted Bitbucket runner (infra box)

The runner runs as a compose service (`roles/infra_compose`), deployed by Ansible.
Infra services are deployed **from local via Ansible**; only the app is deployed
from the pipeline.

1. In Bitbucket: **Repository settings → Runners → Add runner → Linux / Docker**.
   Bitbucket shows a `docker run` command — copy the values from its `-e` flags.
2. Put them into the infra vault:
   ```bash
   cp group_vars/infra/vault.yml.example group_vars/infra/vault.yml
   ansible-vault encrypt group_vars/infra/vault.yml   # then `ansible-vault edit`
   ```
3. Apply:
   ```bash
   ansible-playbook site.yml --ask-vault-pass
   ```

The compose mounts the host docker socket so pipeline steps run as sibling
containers (how the runner builds + pushes images). Note: socket access ≈ root on
the infra host — inherent to self-hosted docker runners.

Still TODO for the runner: mount the deploy key (commented in the compose) and add
`runs-on: [self.hosted, linux]` in `bitbucket-pipelines.yml`.

## What this does NOT do

- It does **not** deploy the app — that's the pipeline's job.
- The registry runs **insecure over the private network** (deliberate; harden with
  TLS + auth later).
- Backups (`pg_dump` + rsync to the infra box) are not wired here yet.

## Deploy key (auto-generated)

The deploy account's keypair is **not** entered by hand. The `deploy_key` role
generates it on the infra box (`deploy_key_path`), and `deploy_target` authorises
the public key on prod automatically via a cross-host fact. So:

- The runner key flows infra → prod during a **full `site.yml` run** (the infra
  play must run before the prod play; `--limit prod` alone skips authorising it).
- `deploy_ssh_keys` in `group_vars/all.yml` is only for **manual** deploys from
  laptops and is empty by default.
- Wiring the private key (`deploy_key_path`) into the runner is a later step.

## Notes / TODO markers

- Replace every `CHANGE_ME` in `inventory/hosts.yml` and `group_vars/`.
- `arch=amd64` is hardcoded in the docker repo (Hetzner x86).
- `community.docker` needs the python docker SDK on the target — installed by the
  `registry` role (`python3-docker`).
