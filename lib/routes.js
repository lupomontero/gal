'use strict';


const Images = require('./images');


module.exports = [
  {
    method: 'GET',
    path: '/_images',
    handler: Images.list
  },
  {
    method: 'GET',
    path: '/_images/{id}',
    handler: Images.get
  },
  {
    method: 'GET',
    path: '/',
    handler: function (req, reply) {

      reply.view('index', {
        title: 'THE FUCKING TITLE'
      });
    }
  },
  {
    method: 'GET',
    path: '/{p*}',
    handler: { directory: { path: '.' } }
  }
];

