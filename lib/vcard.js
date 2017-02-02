'use strict';


exports.get = function (req, reply) {


  return reply({ok:true});

/*
  const cacheKey = Url.format(req.url);
  const fileUri = 'https://www.googleapis.com/drive/v3/files/' + req.params.id;
  const google = Google(req.server.settings.app.jwt);
  const authClient = google._options.auth;

  const cached = Cache.get(cacheKey);

  if (cached) {
    return reply(cached);
  }

  authClient.authorize((err, token) => {

    if (err) {
      return reply(err);
    }

    const stream = Request(fileUri + '?alt=media', {
      encoding: null,
      headers: {
        Authorization: 'Bearer ' + token.access_token
      }
    });

    stream.once('response', (resp) => {

      const writer = EventStream.writeArray((err, bufs) => {

        const buf = Buffer.concat(bufs);
        Cache.set(cacheKey, buf, { maxAge: -1 });
      });

      reply(resp);
      resp.pipe(writer);
    });
  });
*/
};


exports.register = function (server, options, cb) {

  return cb();
};


exports.register.attributes = {
  name: 'vcard'
};
