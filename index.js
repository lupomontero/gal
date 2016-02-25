'use strict';


const Hapi = require('hapi');
const Inert = require('inert');
const Images = require('./lib/images');
const Routes = require('./lib/routes');
const Pkg = require('./package.json');


const server = new Hapi.Server({
  app: {
    port: process.env.PORT || 3000,
    name: process.env.NAME || Pkg.name,
    admins: (function () {

      const admins = (process.env.ADMINS || '').split(',').map((admin) => {

        return admin.trim();
      });

      if (!admins || !admins.length) {
        throw new Error('No admins defined!');
      }

      if (admins.length === 1 && /\.json$/.test(admins[0])) {
        return require(admins[0]);
      }

      return admins;
    }()),
    jwt: (function () {

      if (process.env.JWT) {
        return require(process.env.JWT);
      }
      return {
        client_email: process.env.JWT_EMAIL,
        private_key: process.env.JWT_PRIVATE_KEY
      }
    }())
  }
});

server.connection({ port: server.settings.app.port });

server.register([Inert, Images], (err) => {

  if (err) {
    throw err;
  }

  server.route(Routes);

  server.start((err) => {

    if (err) {
      throw err;
    }

    console.log('Server running at:', server.info.uri);
  });
});
