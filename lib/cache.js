'use strict';


const internals = {
  maxAge: 300, // in secs?
  data: {},
  cache: {}
};


exports.get = function (key, options) {

  options = options || {};

  const item = internals.data[key];

  if (!item) {
    return null;
  }

  const maxAge = options.maxAge || item.maxAge || internals.maxAge;
  const age = (Date.now() - item.ts) / 1000;

  if (age > maxAge) {
    delete internals.data[key];
    return null;
  }

  return internals.data[key].value;
};


exports.set = function (key, value, options) {

  options = options || {};

  internals.data[key] = {
    value: value,
    ts: Date.now(),
    maxAge: options.maxAge || internals.maxAge
  };
};
