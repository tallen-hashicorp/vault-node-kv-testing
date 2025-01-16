provider "vault" {

}

resource "vault_mount" "api" {
  path    = "api"
  type    = "kv"
  options = { version = "2" }
}

resource "vault_policy" "api-full" {
  name = "api-full"

  policy = <<EOT
path "api/*" {
  capabilities = ["create", "read", "update", "patch", "delete", "list"]
}
EOT
}

resource "vault_jwt_auth_backend" "jwt" {
  path                   = "jwt"
  jwt_validation_pubkeys = [file("${path.module}/jwt_key.pub")]

  tune {
    default_lease_ttl = "1h"
    max_lease_ttl     = "2h"
  }
}

resource "vault_jwt_auth_backend_role" "api-role" {
  backend        = vault_jwt_auth_backend.jwt.path
  role_name      = "api"
  token_policies = ["api-full", "default"]


  bound_claims = {
    app = "api-app-name"
  }
  user_claim = "app"
  role_type  = "jwt"
}

# Not needed for prod, just for testing
resource "vault_kv_secret_v2" "example" {
  mount               = vault_mount.api.path
  name                = "notion"
  cas                 = 0
  delete_all_versions = true
  data_json = jsonencode(
    {
      foo = "bar"
    }
  )
}
