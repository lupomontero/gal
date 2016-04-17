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

      const context = {
        title: 'THE FUCKING TITLE'
      };

      req.server.inject('/_images', (resp) => {

        if (resp.statusCode !== 200) {
          // TODO: Handle error!!!
          return reply.view('index', context);
        }

        context.images = resp.result;
        reply.view('index', context);
      });
    }
  },
  {
    method: 'GET',
    path: '/{p*}',
    handler: { directory: { path: '.' } }
  }
];

