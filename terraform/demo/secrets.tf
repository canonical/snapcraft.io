// discourse-api-key
data "juju_secret" "snapcraft_io-discourse_api_key" {
  name       = "snapcraft_io-discourse_api_key"
  model_uuid = data.juju_model.demos.uuid
}

resource "juju_access_secret" "discourse_api_key-access" {
  model_uuid = data.juju_model.demos.uuid

  secret_id = data.juju_secret.snapcraft_io-discourse_api_key.secret_id

  applications = [
    juju_application.demo.name
  ]
}

// dns-verification-salt
data "juju_secret" "snapcraft_io-dns_verification_salt" {
  name       = "snapcraft_io-dns_verification_salt"
  model_uuid = data.juju_model.demos.uuid
}

resource "juju_access_secret" "dns_verification_salt-access" {
  model_uuid = data.juju_model.demos.uuid

  secret_id = data.juju_secret.snapcraft_io-dns_verification_salt.secret_id

  applications = [
    juju_application.demo.name
  ]
}

// flask-secret-key
data "juju_secret" "snapcraft_io-flask_secret_key" {
  name       = "snapcraft_io-flask_secret_key"
  model_uuid = data.juju_model.demos.uuid
}

resource "juju_access_secret" "flask_secret_key-access" {
  model_uuid = data.juju_model.demos.uuid

  secret_id = data.juju_secret.snapcraft_io-flask_secret_key.secret_id

  applications = [
    juju_application.demo.name
  ]
}

// github-client-secret
data "juju_secret" "snapcraft_io-github_client_secret" {
  name       = "snapcraft_io-github_client_secret"
  model_uuid = data.juju_model.demos.uuid
}

resource "juju_access_secret" "github_client_secret-access" {
  model_uuid = data.juju_model.demos.uuid

  secret_id = data.juju_secret.snapcraft_io-github_client_secret.secret_id

  applications = [
    juju_application.demo.name
  ]
}

// github-snapcraft-bot-user-token
data "juju_secret" "snapcraft_io-github_snapcraft_bot_user_token" {
  name       = "snapcraft_io-github_snapcraft_bot_user_token"
  model_uuid = data.juju_model.demos.uuid
}

resource "juju_access_secret" "github_snapcraft_bot_user_token-access" {
  model_uuid = data.juju_model.demos.uuid

  secret_id = data.juju_secret.snapcraft_io-github_snapcraft_bot_user_token.secret_id

  applications = [
    juju_application.demo.name
  ]
}

// github-snapcraft-user-token
data "juju_secret" "snapcraft_io-github_snapcraft_user_token" {
  name       = "snapcraft_io-github_snapcraft_user_token"
  model_uuid = data.juju_model.demos.uuid
}

resource "juju_access_secret" "github_snapcraft_user_token-access" {
  model_uuid = data.juju_model.demos.uuid

  secret_id = data.juju_secret.snapcraft_io-github_snapcraft_user_token.secret_id

  applications = [
    juju_application.demo.name
  ]
}

// github-webhook-secret
data "juju_secret" "snapcraft_io-github_webhook_secret" {
  name       = "snapcraft_io-github_webhook_secret"
  model_uuid = data.juju_model.demos.uuid
}

resource "juju_access_secret" "github_webhook_secret-access" {
  model_uuid = data.juju_model.demos.uuid

  secret_id = data.juju_secret.snapcraft_io-github_webhook_secret.secret_id

  applications = [
    juju_application.demo.name
  ]
}

// lp-api-token
data "juju_secret" "snapcraft_io-lp_api_token" {
  name       = "snapcraft_io-lp_api_token"
  model_uuid = data.juju_model.demos.uuid
}

resource "juju_access_secret" "lp_api_token-access" {
  model_uuid = data.juju_model.demos.uuid

  secret_id = data.juju_secret.snapcraft_io-lp_api_token.secret_id

  applications = [
    juju_application.demo.name
  ]
}

// lp-api-token-secret
data "juju_secret" "snapcraft_io-lp_api_token_secret" {
  name       = "snapcraft_io-lp_api_token_secret"
  model_uuid = data.juju_model.demos.uuid
}

resource "juju_access_secret" "lp_api_token_secret-access" {
  model_uuid = data.juju_model.demos.uuid

  secret_id = data.juju_secret.snapcraft_io-lp_api_token_secret.secret_id

  applications = [
    juju_application.demo.name
  ]
}

// marketo-client-id
data "juju_secret" "snapcraft_io-marketo_client_id" {
  name       = "snapcraft_io-marketo_client_id"
  model_uuid = data.juju_model.demos.uuid
}

resource "juju_access_secret" "marketo_client_id-access" {
  model_uuid = data.juju_model.demos.uuid

  secret_id = data.juju_secret.snapcraft_io-marketo_client_id.secret_id

  applications = [
    juju_application.demo.name
  ]
}

// marketo-client-secret
data "juju_secret" "snapcraft_io-marketo_client_secret" {
  name       = "snapcraft_io-marketo_client_secret"
  model_uuid = data.juju_model.demos.uuid
}

resource "juju_access_secret" "marketo_client_secret-access" {
  model_uuid = data.juju_model.demos.uuid

  secret_id = data.juju_secret.snapcraft_io-marketo_client_secret.secret_id

  applications = [
    juju_application.demo.name
  ]
}

// youtube-api-key
data "juju_secret" "snapcraft_io-youtube_api_key" {
  name       = "snapcraft_io-youtube_api_key"
  model_uuid = data.juju_model.demos.uuid
}

resource "juju_access_secret" "youtube_api_key-access" {
  model_uuid = data.juju_model.demos.uuid

  secret_id = data.juju_secret.snapcraft_io-youtube_api_key.secret_id

  applications = [
    juju_application.demo.name
  ]
}
