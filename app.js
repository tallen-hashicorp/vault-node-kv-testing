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
        console.log("ttl: " + self.data.ttl)
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


async function main() {
    let jwt = await generateJWT();
    await loginVaultJWT(jwt);

    if (await selfLookup()) {
        console.log("Still Logged In")
    } else {
        console.log("Not Logged In")
    }

    console.log(await getKv("notion"));
}

main();