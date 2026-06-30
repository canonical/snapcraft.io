resource "juju_application" "demo" {
  name       = var.demo_id
  model_uuid = data.juju_model.demos.uuid

  charm {
    name = "snapcraft-io"
  }

  config = {
    environment = "production"
    bsi-url = "https://build.snapcraft.io"
    devicegw-url = "https://api.snapcraft.io/"
    login-url = "https://login.ubuntu.com"
    publishergw-url = "https://api.charmhub.io"
    report-sheet-url = "https://script.google.com/macros/s/AKfycbywNDNVeD4_xnE36HP7gJUbbLHNrrcxgy0yVuwr0poPfGoDnH0Vl1oOWjnRXNtLkrcmlQ/exec"
    snapstore-dashboard-api-url = "https://dashboard.snapcraft.io/"
    analytics-endpoint = ""
    // secrets
    discourse = "secret:${data.juju_secret.snapcraft_discourse.secret_id}"
    dns-verification = "secret:${data.juju_secret.snapcraft_dns_verification.secret_id}"
    github = "secret:${data.juju_secret.snapcraft_github.secret_id}"
    lp = "secret:${data.juju_secret.snapcraft_lp.secret_id}"
    marketo = "secret:${data.juju_secret.snapcraft_marketo.secret_id}"
    youtube = "secret:${data.juju_secret.snapcraft_youtube.secret_id}"
    turnstile = "secret:${data.juju_secret.snapcraft_turnstile.secret_id}"
  }
}

resource "juju_integration" "demo_ingress" {
  model_uuid = data.juju_model.demos.uuid

  application {
    name     = juju_application.demo.name
    endpoint = "ingress"
  }

  application {
    name     = "subdomain-integrator"
    endpoint = "ingress"
  }
}

// Redis instance and relation

resource "juju_application" "redis" {
  name = "${var.demo_id}-redis"
  model_uuid = data.juju_model.demos.uuid

  charm {
    name = "redis-k8s"
    channel = "latest/edge"
  }
}

resource "juju_integration" "demo_redis" {
  model_uuid = data.juju_model.demos.uuid

  application {
    name      = juju_application.demo.name
    endpoint  = "redis"
  }

  application {
    name      = juju_application.redis.name
    endpoint  = "redis"
  }
}
