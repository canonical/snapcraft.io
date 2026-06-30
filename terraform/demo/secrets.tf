// These secrets have been added manually to the Demos environment

data "juju_secret" "snapcraft-turnstile" {
  name       = "snapcraft-turnstile"
  model_uuid = data.juju_model.demos.uuid
}

resource "juju_access_secret" "turnstile-access" {
  model_uuid   = data.juju_model.demos.uuid
  secret_id    = data.juju_secret.snapcraft-turnstile.secret_id
  applications = [
    juju_application.demo.name
  ]
}

data "juju_secret" "snapcraft-marketo" {
  name       = "snapcraft-marketo"
  model_uuid = data.juju_model.demos.uuid
}

resource "juju_access_secret" "marketo-access" {
  model_uuid   = data.juju_model.demos.uuid
  secret_id    = data.juju_secret.snapcraft-marketo.secret_id
  applications = [
    juju_application.demo.name
  ]
}

data "juju_secret" "snapcraft-github" {
  name       = "snapcraft-github"
  model_uuid = data.juju_model.demos.uuid
}

resource "juju_access_secret" "github-access" {
  model_uuid   = data.juju_model.demos.uuid
  secret_id    = data.juju_secret.snapcraft-github.secret_id
  applications = [
    juju_application.demo.name
  ]
}

data "juju_secret" "snapcraft-lp" {
  name       = "snapcraft-lp"
  model_uuid = data.juju_model.demos.uuid
}

resource "juju_access_secret" "lp-access" {
  model_uuid   = data.juju_model.demos.uuid
  secret_id    = data.juju_secret.snapcraft-lp.secret_id
  applications = [
    juju_application.demo.name
  ]
}

data "juju_secret" "snapcraft-youtube" {
  name       = "snapcraft-youtube"
  model_uuid = data.juju_model.demos.uuid
}

resource "juju_access_secret" "youtube-access" {
  model_uuid   = data.juju_model.demos.uuid
  secret_id    = data.juju_secret.snapcraft-youtube.secret_id
  applications = [
    juju_application.demo.name
  ]
}

data "juju_secret" "snapcraft-discourse" {
  name       = "snapcraft-discourse"
  model_uuid = data.juju_model.demos.uuid
}

resource "juju_access_secret" "discourse-access" {
  model_uuid   = data.juju_model.demos.uuid
  secret_id    = data.juju_secret.snapcraft-discourse.secret_id
  applications = [
    juju_application.demo.name
  ]
}

data "juju_secret" "snapcraft-dns-verification" {
  name       = "snapcraft-dns-verification"
  model_uuid = data.juju_model.demos.uuid
}

resource "juju_access_secret" "dns-verification-access" {
  model_uuid   = data.juju_model.demos.uuid
  secret_id    = data.juju_secret.snapcraft-dns-verification.secret_id
  applications = [
    juju_application.demo.name
  ]
}
