const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());


const jwt = require('jsonwebtoken');
const fs = require('fs');

var vaultOptions = {
    apiVersion: 'v1',
    endpoint: process.env.VAULT_ADDR,
};

var vault = require("node-vault")(vaultOptions);

var privateKey = fs.readFileSync('jwt_key');
var publicKey = fs.readFileSync('jwt_key.pub');

async function generateJWT(sub) {
    var token = jwt.sign({
        app: "api-app-name",
        exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour
    }, privateKey, { algorithm: 'RS256' });

    return token;
}

async function loginVaultJWT(token) {
    try {
        var login = await vault.write('auth/jwt/login', {
            role: 'api',
            jwt: token,
        })
        vault.token = login.auth.client_token;
        if (vault.token) {
            console.log("Vault Login Successful")
        }
        return login.auth.client_token;
    } catch (e) {
        console.log("Can Not Login To Vault")
    }
}

async function selfLookup() {
    try {
        var self = await vault.tokenLookupSelf();
        return true;
    } catch (e) {
        return false;
    }
}

async function getKv(path) {
    //Check if logged in still
    if (!await selfLookup()) {
        let jwt = await generateJWT();
        await loginVaultJWT(jwt);
    }

    var kv = await vault.read("api/data/" + path);
    return kv.data.data;
}

app.get('/', async (req, res) => {
    var notion = await getKv("notion")
    res.json(notion)
  });


async function initialVaultLogin() {
    let jwt = await generateJWT();
    await loginVaultJWT(jwt);
}

initialVaultLogin();

app.listen(port, () => {
    console.log(`Server started on port ${port}`);
  });