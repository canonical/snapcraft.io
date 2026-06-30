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
    discourse = data.juju_secret.snapcraft-discourse.secret_uri
    dns-verification = data.juju_secret.snapcraft-dns-verification.secret_uri
    github = data.juju_secret.snapcraft-github.secret_uri
    lp = data.juju_secret.snapcraft-lp.secret_uri
    marketo = data.juju_secret.snapcraft-marketo.secret_uri
    youtube = data.juju_secret.snapcraft-youtube.secret_uri
    turnstile = data.juju_secret.snapcraft-turnstile.secret_uri
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
