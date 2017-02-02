'use strict';


const Path = require('path');
const Hapi = require('hapi');
const Inert = require('inert');
const Vision = require('vision');
const Handlebars = require('handlebars');
const Drive = require('./lib/drive');
const Routes = require('./lib/routes');
const Pkg = require('./package.json');


const internals = {};


internals.settings = function (options) {

  return {
    theme: options.theme || process.env.THEME || 'default',
    port: options.port || process.env.PORT || 3000,
    name: options.name || process.env.NAME || Pkg.name,
    admins: (function () {

      if (options.admins) {
        return options.admins;
      }

      const admins = (process.env.ADMINS || '').split(',').map((admin) => {

        return admin.trim();
      }).filter((admin) => {

        return admin !== '';
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

      if (options.jwt) {
        return options.jwt;
      }

      if (process.env.JWT) {
        return require(process.env.JWT);
      }
      return {
        client_email: process.env.JWT_EMAIL,
        private_key: process.env.JWT_PRIVATE_KEY
      }
    }())
  }
};


module.exports = (options, cb) => {

  cb = cb || function () {};

  const settings = internals.settings(options || {});
  const server = new Hapi.Server({
    app: settings,
    connections: {
      routes: {
        files: {
          relativeTo: Path.join(__dirname, 'themes', settings.theme)
        }
      }
    }
  });

  server.connection({ port: server.settings.app.port });

  server.register([Inert, Vision, Drive], (err) => {

    if (err) {
      return cb(err);
    }

    server.views({
      engines: {
        html: Handlebars
      },
      relativeTo: Path.join(__dirname, 'themes'),
      path: settings.theme,
      //helpersPath: 'helpers'
    });

    server.route(Routes);

    cb(null, server);
  });
};


if (require.main === module) {
  module.exports({}, (err, server) => {

    if (err) {
      throw err;
    }

    server.start((err) => {

      if (err) {
        throw err;
      }

      console.log('Server running at:', server.info.uri);
    });
  });
}
