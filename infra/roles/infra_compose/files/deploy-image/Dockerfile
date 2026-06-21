# Deploy image for the pipeline's manual `deploy to prod` step.
#
# Why: pipeline steps run as sibling containers and cannot see the runner's bind
# mounts, so a host-mounted SSH key never reaches the deploy step. Instead we
# bake openssh-client plus the deploy keypair's PRIVATE key and a pinned
# known_hosts into this image. Built on the infra host and pushed to the local
# registry by the infra_compose role; the deploy step pulls it from there.
#
# SECURITY: the private key lives unencrypted in an image layer in the
# unauthenticated, plain-HTTP private registry. Confidentiality therefore rests
# entirely on private-network + UFW access control. The key only grants the
# unprivileged deploy@prod account (docker group, no sudo), so the blast radius
# is limited. Rotate by regenerating the keypair (deploy_key role) and rebuilding.
FROM alpine:3.20

RUN apk add --no-cache openssh-client

# Staged into the build context by the infra_compose role.
COPY deploy_key /root/.ssh/deploy_key
COPY known_hosts /root/.ssh/known_hosts
RUN chmod 700 /root/.ssh \
 && chmod 600 /root/.ssh/deploy_key /root/.ssh/known_hosts
