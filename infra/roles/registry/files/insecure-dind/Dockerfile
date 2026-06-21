# Custom Docker-in-Docker image for the Bitbucket Pipelines `docker` service.
#
# Why: the stock docker:dind image ignores DOCKER_OPTS, so its dockerd always
# probes a registry over HTTPS first. Our private registry serves plain HTTP, so
# the HTTPS probe never completes the TLS handshake and the push hangs until the
# client times out ("Client.Timeout exceeded while awaiting headers").
#
# This image forwards DOCKER_OPTS (set to --insecure-registry=<host> in
# bitbucket-pipelines.yml) to dockerd, which then talks plain HTTP to the
# registry. dockerd-entrypoint.sh prepends `dockerd` when its first arg is a
# flag, so the forwarded option lands as `dockerd --insecure-registry=...`.
#
# See the Atlassian KB "Configuring Docker daemon for insecure registries in
# Bitbucket Cloud Pipelines" and docs/adr/0010 (deployment infrastructure).
FROM docker:27-dind

ENTRYPOINT ["sh", "-c", "dockerd-entrypoint.sh $DOCKER_OPTS"]
