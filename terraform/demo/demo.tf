resource "juju_application" "demo" {
  name       = var.demo_id
  model_uuid = data.juju_model.demos.uuid

  charm {
    name = "snapcraft-io"
  }

  config = {
    bsi-url = "https://build.snapcraft.io"
    devicegw-url = "https://api.snapcraft.io/"
    discourse-api-key = data.juju_secret.snapcraft_io-discourse_api_key.secret_uri
    discourse-api-username = "system"
    dns-verification-salt = data.juju_secret.snapcraft_io-dns_verification_salt.secret_uri
    environment = "production"
    flask-preferred-url-scheme = "HTTPS"
    flask-secret-key = data.juju_secret.snapcraft_io-flask_secret_key.secret_uri
    github-client-id = "029a65c1d9dc821b0227"
    github-client-secret = data.juju_secret.snapcraft_io-github_client_secret.secret_uri
    github-snapcraft-bot-user-token = data.juju_secret.snapcraft_io-github_snapcraft_bot_user_token.secret_uri
    github-snapcraft-user-token = data.juju_secret.snapcraft_io-github_snapcraft_user_token.secret_uri
    github-webhook-host-url = "https://snapcraft.io/"
    github-webhook-secret = data.juju_secret.snapcraft_io-github_webhook_secret.secret_uri
    login-url = "https://login.ubuntu.com"
    lp-api-token = data.juju_secret.snapcraft_io-lp_api_token.secret_uri
    lp-api-token-secret = data.juju_secret.snapcraft_io-lp_api_token_secret.secret_uri
    lp-api-username = "build.snapcraft.io"
    marketo-client-id = data.juju_secret.snapcraft_io-marketo_client_id.secret_uri
    marketo-client-secret = data.juju_secret.snapcraft_io-marketo_client_secret.secret_uri
    publishergw-url = "https://api.charmhub.io"
    report-sheet-url = "https://script.google.com/macros/s/AKfycbywNDNVeD4_xnE36HP7gJUbbLHNrrcxgy0yVuwr0poPfGoDnH0Vl1oOWjnRXNtLkrcmlQ/exec"
    snapstore-dashboard-api-url = "https://dashboard.snapcraft.io/"
    youtube-api-key = data.juju_secret.snapcraft_io-youtube_api_key.secret_uri
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
