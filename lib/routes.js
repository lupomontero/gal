'use strict';


const Path = require('path');
const Async = require('async');
const Drive = require('./drive');
const Vcard = require('./vcard');


module.exports = [
  {
    method: 'GET',
    path: '/_meta',
    handler: Drive.meta
  },
  {
    method: 'GET',
    path: '/_tree',
    handler: Drive.tree
  },
  {
    method: 'GET',
    path: '/_images/{id}',
    handler: Drive.get
  },
  {
    method: 'GET',
    path: '/_vcard',
    handler: Vcard.get
  },
  {
    method: 'GET',
    path: '/',
    handler: function (req, reply) {

      req.server.methods.meta((err, result) => {

        if (err) {
          return cb(err);
        }

        console.log(result);
        reply.view('index', {});
      });
    }
  },
  {
    method: 'GET',
    path: '/{p*}',
    handler: { directory: { path: '.' } }
  }
];
