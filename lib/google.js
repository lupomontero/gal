'use strict';


const Google = require('googleapis');
const GoogleAuth = require('google-auth-library');


module.exports = function (options) {

  const auth = new GoogleAuth();
  const email = options.client_email;
  const key = options.private_key;
  const scopes = ['https://www.googleapis.com/auth/drive'];
  const user = null;
  const authClient = new auth.JWT(email, null, key, scopes, user);


  Google.options({ auth: authClient });

  return Google;
};
