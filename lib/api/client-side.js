var resourceLoader = require('./resource-loader'),
    fs = require('fs');

var cache = {};

exports = module.exports = {
  loadHtml: function(app, branch, callback) {
    branch = branch || '$default';

    if (cache[branch]) {
      setImmediate(function() {
        callback(undefined, cache[branch]);
      });
      return;
    }

    var indexFile = resourceLoader.index(app, branch);
    if (!indexFile) {
      throw new Error('Unknown index file for app "' + app + '" on branch "' + branch + '"');
    }

    fs.readFile(indexFile, function(err, data) {
      if (err) {
        return callback(err);
      }

      data = data.toString();

      var index = data.indexOf('<script');
      if (index !== -1) {
        cache[branch] = [ data.substring(0, index), data.substring(index) ];
      } else {
        cache[branch] = [ data ];
      }
      callback(undefined, cache[branch]);
    });
  },
  inline: function(app, configVar, config, callback) {
    config = config || '';
    if (config && !configVar) {
      return callback(new Error('Config var not specified'));
    }

    exports.loadHtml(app, config.branch, function(err, data) {
      if (err) {
        return callback(err);
      }

      if (config) {
        config = '<script type="text/javascript">'
            + configVar
            + ' = '
            + JSON.stringify(config)
            + ';</script>\n';
        data = data[0] + config + (data[1] || '');
      } else {
        data = data.join('');
      }

      callback(undefined, data);
    });
  },

  reset: function() {
    cache = {};
  }
};
