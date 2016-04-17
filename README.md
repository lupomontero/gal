# gal

## Before you get started

1. Create a project on Google Cloud...
2. ...

## Options

* `PORT`: Port the server will bind to. Default is `3000`.
* `JWT`: Path to json file with jwt credentials.
* `JWT_EMAIL`: If not using `JWT` you can specify JWT client email along with
  `JWT_PRIVATE_KEY`.
* `JWT_PRIVATE_KEY`: String with private key. Used with `JWT_EMAIL`.
* `ADMINS`: Comma separated lists of admin emails or path to json file with
  array of admin emails.
* `NAME`: Shared folder name. Default value is the `name` property from the
  `package.json` file.

## Example using `jwt.json` file

```json
{
  "type": "service_account",
  "project_id": "<your project id>",
  "private_key_id": "<your private key id>",
  "private_key": "<your private key>",
  "client_email": "<your client email>",
  "client_id": "<your client id>",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://accounts.google.com/o/oauth2/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/<your client email>"
}
```

Start `gal` using Google credentials from JWT json file:

```sh
JWT=/path/to/jwt.json ADMINS=foo@bar.org npm start
```

Start `gal` specifying Google credentials using `JWT_EMAIL` and
`JWT_PRIVATE_KEY` env vars:

```sh
JWT_EMAIL=xx-000@foo-bar-12345.iam.gserviceaccount.com \
JWT_PRIVATE_KEY=`cat /path/to/key.pem` \
ADMINS=foo@bar.org \
NAME=mysite.org \
npm start
```

## How it works

1. On startup, the server 

