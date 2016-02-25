'use strict';


const internals = {
  maxAge: 300, // in secs?
  data: {},
  cache: {}
};


exports.get = function (key, options) {

  options = options || {};

  if (!internals.data.hasOwnProperty(key)) {
    return null;
  }

  const item = internals.data[key];
  const maxAge = options.maxAge || item.maxAge || internals.maxAge;
  const age = (Date.now() - item.ts) / 1000;

  if (maxAge > 0 && age > maxAge) {
    exports.unset(key);
    return null;
  }

  //console.log(key + ' read from cache');
  return item.value;
};


exports.set = function (key, value, options) {

  options = options || {};

  internals.data[key] = {
    value: value,
    ts: Date.now(),
    maxAge: options.maxAge || internals.maxAge
  };
};


exports.unset = function (key) {

  if (internals.data.hasOwnProperty(key)) {
    delete internals.data[key];
  }
};


exports.keys = function () {

  return Object.keys(internals.data);
};
