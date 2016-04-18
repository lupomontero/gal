'use strict';


const Url = require('url');
const Async = require('async');
const Request = require('request');
const EventStream = require('event-stream');
const Google = require('./google');
const Cache = require('./cache');


const internals = {};


internals.shared = null;


internals.addPermission = function (google, id, email, cb) {

  const drive = google.drive('v3');

  drive.permissions.create({
    fileId: id,
    emailMessage: 'Hey, your pics can be uploaded here!',
    sendNotificationEmail: true,
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


internals.checkSharedFolderPermissions = function (server, google, shared, cb) {

  const drive = google.drive('v3');

  drive.permissions.list({ fileId: shared.id }, (err, resp) => {

    if (err) {
      return cb(err);
    }

    Async.map(resp.permissions, (permission, mapCb) => {

      if (permission.type !== 'user' || permission.role !== 'writer') {
        return mapCb();
      }

      drive.permissions.get({
        fileId: shared.id,
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

        internals.addPermission(google, shared.id, admin, eachCb);
      }, cb);
    });
  });
};


internals.initSharedFolder = function (server, google, cb) {

  const name = server.settings.app.name;

  google.drive('v3').files.list({
    q: 'mimeType=\'application/vnd.google-apps.folder\'',
  }, (err, fileList) => {

    if (err) {
      return cb(err);
    }

    const shared = fileList.files.find((file) => {

      return file.name === name;
    });

    if (shared) {
      console.log('shared folder exists (' + shared.id + ')');
      internals.shared = shared;
      return internals.checkSharedFolderPermissions(server, google, shared, cb);
    }

    console.log('shared folder does not exist');

    google.drive('v2').files.insert({
      resource: {
        title: name,
        mimeType: 'application/vnd.google-apps.folder'
      }
    }, (err, shared) => {

      if (err) {
        return cb(err);
      }

      console.log('shared folder created (' + shared.id + ')');
      internals.shared = shared;
      internals.checkSharedFolderPermissions(server, google, shared, cb);
    });
  });
};


exports.register = function (server, options, cb) {

  const jwt = server.settings.app.jwt;
  console.log('jwt email: ' + jwt.client_email);

  const google = Google(jwt);

  internals.initSharedFolder(server, google, cb);
};


exports.register.attributes = {
  name: 'images'
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


exports.list = function (req, reply) {

  const cacheKey = Url.format(req.url);
  const google = Google(req.server.settings.app.jwt);
  const drive = google.drive('v3');
  const parent = internals.shared.id;

  const cached = Cache.get(cacheKey);

  if (cached) {
    //console.log('cache: [' + cacheKey + ']');
    return reply(cached);
  }

  //console.log('remote: [' + cacheKey + ']');

  drive.files.list({
    pageSize: 100,
    q: 'mimeType=\'image/jpeg\' and \'' + parent + '\' in parents',
    fields: 'nextPageToken, files(id, name)'
  }, (err, response) => {

    if (err) {
      return reply(err);
    }

    Cache.set(cacheKey, response.files);
    reply(response.files);
    internals.cleanCache(response.files);
  });
};


exports.get = function (req, reply) {

  const cacheKey = Url.format(req.url);
  const fileUri = 'https://www.googleapis.com/drive/v3/files/' + req.params.id;
  const google = Google(req.server.settings.app.jwt);
  const authClient = google._options.auth;

  const cached = Cache.get(cacheKey);

  if (cached) {
    //console.log('cache: [' + cacheKey + ']');
    return reply(cached);
  }

  //console.log('remote: [' + cacheKey + ']');

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
