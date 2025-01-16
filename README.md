# vault-node-kv-testing

## Setting Up Vault Auth
We will use JWT

### Setup JWT Key
```bash
ssh-keygen -t rsa-sha2-256 -b 2048 -f jwt_key -m pem
openssl rsa -in jwt_key -pubout -outform PEM -out jwt_key.pub
```

### Setup Vault
```bash
export VAULT_ADDR='http://127.0.0.1:8200'
export VAULT_TOKEN=

terraform init

```

