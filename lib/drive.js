'use strict';


const Path = require('path');
const Url = require('url');
const Async = require('async');
const Request = require('request');
const EventStream = require('event-stream');
const Google = require('googleapis');
const GoogleAuth = require('google-auth-library');
const Cache = require('./cache');


const internals = {};


internals.createClient = function (options) {

  const auth = new GoogleAuth();
  const email = options.client_email;
  const key = options.private_key;
  const scopes = ['https://www.googleapis.com/auth/drive'];
  const user = null;
  const authClient = new auth.JWT(email, null, key, scopes, user);


  Google.options({ auth: authClient });

  return Google;
};


internals.addPermission = function (google, id, email, cb) {

  const drive = google.drive('v3');

  drive.permissions.create({
    fileId: id,
    //emailMessage: 'Hey, your pics can be uploaded here!',
    //sendNotificationEmail: true,
    transferOwnership: false,
    resource: {
      role: 'writer',
      type: 'user',
      emailAddress: email
    }
  }, (err, resp) => {

    if (err) {
      return cb(err);
    }

    console.log('write access for ' + email + ' added');
    cb(null, resp);
  });
};


internals.checkSharedFolderPermissions = function (server, root, cb) {

  const google = server.app.google;
  const drive = google.drive('v3');

  drive.permissions.list({ fileId: root.id }, (err, resp) => {

    if (err) {
      return cb(err);
    }

    Async.map(resp.permissions, (permission, mapCb) => {

      if (permission.type !== 'user' || permission.role !== 'writer') {
        return mapCb();
      }

      drive.permissions.get({
        fileId: root.id,
        permissionId: permission.id,
        fields: 'emailAddress'
      }, mapCb);
    }, (err, results) => {

      if (err) {
        return cb(err);
      }

      Async.each(server.settings.app.admins, (admin, eachCb) => {

        const found = results.find((result) => {

          return result && result.emailAddress === admin;
        });

        if (found) {
          console.log(found.emailAddress + ' has write access');
          return eachCb();
        }

        internals.addPermission(google, root.id, admin, eachCb);
      }, cb);
    });
  });
};


internals.initSharedFolder = function (server, cb) {

  const name = server.settings.app.name;
  const google = server.app.google;

  google.drive('v3').files.list({
    q: 'mimeType=\'application/vnd.google-apps.folder\'',
  }, (err, fileList) => {

    if (err) {
      return cb(err);
    }

    const root = fileList.files.find((file) => {

      return file.name === name;
    });

    if (root) {
      console.log('shared folder exists (' + root.id + ')');
      server.app.root = root;
      return internals.checkSharedFolderPermissions(server, root, cb);
    }

    console.log('shared folder does not exist');

    google.drive('v2').files.insert({
      resource: {
        title: name,
        mimeType: 'application/vnd.google-apps.folder'
      }
    }, (err, root) => {

      if (err) {
        return cb(err);
      }

      console.log('shared folder created (' + root.id + ')');
      server.app.root = root;
      internals.checkSharedFolderPermissions(server, root, cb);
    });
  });
};


//
// Remove images no longer needed from cache.
//
internals.cleanCache = function (files) {

  const cacheKeys = Cache.keys();

  cacheKeys.forEach((key) => {

    const keyParts = key.split('/').slice(1);
    if (keyParts[0] !== '_images' || keyParts.length !== 2) {
      return;
    }

    const file = files.find((file) => {

      return file.id === keyParts[1];
    });

    // if no file found for cache entry we remove it
    if (!file) {
      Cache.unset(key);
      console.log('key ' + key + ' has been removed from the cache');
    }
  });
};


internals.meta = function (server) {

  const sheets = server.app.google.sheets('v4');

  const createMeta = function (cb) {

    console.log(sheets.spreadsheets.create);

    sheets.spreadsheets.create({
      properties: {
        title: 'meta'
      }
    }, (err, result) => {

console.log(err, result);
      cb(null, {fuck: 'createMeta'});
    });
  };

  const openMeta = function (id, cb) {

    //sheets.spreadsheets.get();
    cb(null, {fuck: 'openMeta'});
  };

  return function (cb) {

    server.methods.tree((err, tree) => {

      if (err) {
        return cb(err);
      }

      if (tree.meta && tree.meta.id) {
        return openMeta(tree.meta.id, cb);
      }

      createMeta(cb);
    });
  };
};


internals.parseFile = function (file) {

  const name = file.name.trim();
  file.basename = Path.basename(name, '.jpg');

  const matches = /^([0-9\.]+)\.\s+(.*)/.exec(file.basename);

  if (matches && matches.length > 2) {
    file.title = matches[2];
    file.sortOrder = parseFloat(matches[1], 10);
  }
  else {
    file.title = file.basename;
    //file.sortOrder = response.files.length;
  }

  return file;
};


internals.sort = function (files) {

  files.sort((a, b) => {

    if (a.sortOrder > b.sortOrder) {
      return 1;
    }
    if (a.sortOrder < b.sortOrder) {
      return -1;
    }

    // If sortOrder is the same, we sort by secondary key (title).
    const titleA = (a.title || a.name).toLowerCase();
    const titleB = (b.title || b.name).toLowerCase();

    if (titleA > titleB) {
      return 1;
    }
    if (titleA < titleB) {
      return -1;
    }

    return 0;
  });
};


internals.tree = function (server) {

  const drive = server.app.google.drive('v3');

  return function tree(parent, cb) {

    if (arguments.length === 1) {
      cb = parent;
      parent = server.app.root.id;
    }

    drive.files.list({
      pageSize: 100,
      q: '\'' + parent + '\' in parents'
    }, (err, response) => {

      if (err) {
        return cb(err);
      }

      const children = [];
      const node = {
        images: []
      };

      response.files.forEach((file) => {

        if (file.mimeType === 'application/vnd.google-apps.folder') {
          children.push(file.id);
        }
        else if (file.mimeType === 'image/jpeg') {
          node.images.push(internals.parseFile(file));
        }
        else if (file.mimeType === 'application/vnd.google-apps.spreadsheet') {
          if (file.name === 'vcard') {
            node.vcard = file;
          }
          else if (file.name === 'meta') {
            node.meta = file;
          }
        }
        else {
          console.log(file);
        }
      });

      internals.sort(node.images);

      if (!children.length) {
        return cb(null, node);
      }

      Async.map(children, tree, (err, results) => {

        if (err) {
          return cb(err);
        }

        node.children = results;
        cb(null, node);
      });
    });
  };
};


exports.meta = function (req, reply) {

  req.server.methods.meta((err, result) => {

    if (err) {
      return reply(err);
    }

    reply(result);
  });
};


exports.tree = function (req, reply) {

  req.server.methods.tree((err, result) => {

    if (err) {
      return reply(err);
    }

    reply(result);
  });
};


exports.get = function (req, reply) {

  const cacheKey = Url.format(req.url);
  const fileUri = 'https://www.googleapis.com/drive/v3/files/' + req.params.id;
  const authClient = req.server.app.google._options.auth;

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
};


exports.register = function (server, options, cb) {

  console.log('jwt email: ' + server.settings.app.jwt.client_email);
  server.app.google = internals.createClient(server.settings.app.jwt);

  server.method('tree', internals.tree(server), {
    cache: {
      expiresIn: 30 * 1000,
      generateTimeout: 3 * 1000
    }
  });

  server.method('meta', internals.meta(server), {
    //cache: {}
  });

  internals.initSharedFolder(server, cb);
};


exports.register.attributes = { name: 'drive' };
