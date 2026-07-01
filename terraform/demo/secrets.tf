// These secrets have been added manually to the Demos environment

data "juju_secret" "snapcraft_turnstile" {
  name       = "snapcraft-turnstile"
  model_uuid = data.juju_model.demos.uuid
}

resource "juju_access_secret" "turnstile_access" {
  model_uuid   = data.juju_model.demos.uuid
  secret_id    = data.juju_secret.snapcraft_turnstile.secret_id
  applications = [
    juju_application.demo.name
  ]
}

data "juju_secret" "snapcraft_marketo" {
  name       = "snapcraft-marketo"
  model_uuid = data.juju_model.demos.uuid
}

resource "juju_access_secret" "marketo_access" {
  model_uuid   = data.juju_model.demos.uuid
  secret_id    = data.juju_secret.snapcraft_marketo.secret_id
  applications = [
    juju_application.demo.name
  ]
}

data "juju_secret" "snapcraft_github" {
  name       = "snapcraft-github"
  model_uuid = data.juju_model.demos.uuid
}

resource "juju_access_secret" "github_access" {
  model_uuid   = data.juju_model.demos.uuid
  secret_id    = data.juju_secret.snapcraft_github.secret_id
  applications = [
    juju_application.demo.name
  ]
}

data "juju_secret" "snapcraft_lp" {
  name       = "snapcraft-lp"
  model_uuid = data.juju_model.demos.uuid
}

resource "juju_access_secret" "lp_access" {
  model_uuid   = data.juju_model.demos.uuid
  secret_id    = data.juju_secret.snapcraft_lp.secret_id
  applications = [
    juju_application.demo.name
  ]
}

data "juju_secret" "snapcraft_youtube" {
  name       = "snapcraft-youtube"
  model_uuid = data.juju_model.demos.uuid
}

resource "juju_access_secret" "youtube_access" {
  model_uuid   = data.juju_model.demos.uuid
  secret_id    = data.juju_secret.snapcraft_youtube.secret_id
  applications = [
    juju_application.demo.name
  ]
}

data "juju_secret" "snapcraft_discourse" {
  name       = "snapcraft-discourse"
  model_uuid = data.juju_model.demos.uuid
}

resource "juju_access_secret" "discourse_access" {
  model_uuid   = data.juju_model.demos.uuid
  secret_id    = data.juju_secret.snapcraft_discourse.secret_id
  applications = [
    juju_application.demo.name
  ]
}

data "juju_secret" "snapcraft_dns_verification" {
  name       = "snapcraft-dns-verification"
  model_uuid = data.juju_model.demos.uuid
}

resource "juju_access_secret" "dns_verification_access" {
  model_uuid   = data.juju_model.demos.uuid
  secret_id    = data.juju_secret.snapcraft_dns_verification.secret_id
  applications = [
    juju_application.demo.name
  ]
}
