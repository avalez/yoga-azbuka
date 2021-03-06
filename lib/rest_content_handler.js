var _ = require("underscore"),
    default_content_handler = require("punch").ContentHandler,
    module_utils = require("punch").Utils.Module,
    request = require("request").defaults( process.env.http_proxy ? { 'proxy': process.env.http_proxy } : {});

var path = require("path");
var jf = require('jsonfile');
var fs = require('fs');

module.exports = {

    parsers: {},

    endpoint: "https://www.googleapis.com/blogger/v3/blogs/1435929899993392849/posts",

    key: process.env.blogger_api_key,

    _config: {},

    outputDir: null,

    setup: function(config) {

        var self = this;

        _.each(config.plugins.parsers, function(value, key){
            self.parsers[key] = module_utils.requireAndSetup(value, config);
        });

        // setup default parser
        self._parser = self.parsers['.html'];

        // setup default content handler
        default_content_handler.setup(config);

        // return setup if there's no specific settings
        if (config.rest) {
            self.endpoint = config.rest.endpoint || self.endpoint;
        }

        self._config = {};

        // check if endpoint exists
        request.get({url: self.endpoint, json: true}, function (err, response, body) {
          if (err) {
            console.log("error", err);
          } else if (body) {
            return self;
          } else {
            console.log("error", "Endpoint does not exist.");
          }
        });

        // contents

        self.outputDir = config.output_dir;
    },

    isSection: function(request_path) {
        var r = /^blog\//;
        if (request_path.match(r)) {
            return true;
        } else {
            return default_content_handler.isSection(request_path);
        }
    },

    getContent: function(path, callback) {
        var self = this;

        var r = /^blog\//;

        if (!path.match(r) || path.match(/\/index$/)) {
            return callback('Does not match content pattern', null, null);
        }

        var page = path.replace(r, '');
        var content_output = {};

        request.get({url: self.endpoint + '/' + page + '?key=' + this.key, json: true}, function (err, response, body) {
            if (!err && response.statusCode == 200) {
                var title = body.title;
                var parsed_output = body.content;
                var modified_date = Date.parse(response.headers['last-modified']);//Date.parse(response.headers['updated'] || response.headers['published']);
                var collected_contents = {site_title: 'Йога-азбука для детей', title: title, contents: parsed_output};
                collected_contents[page] = true;
                callback(null, collected_contents, modified_date);
            } else {
                console.log("Error", err, response.statusCode, body);
                callback(response.statusCode + ':' + body.message, null, null);
            }
        });
    },
    
    getPosts: function(callback) {
        var self = this;
        request.get({url: self.endpoint + '?key=' + this.key, json: true}, function (err, response, body) {
            if (!err && response.statusCode == 200) {
                var modified_date = Date.parse(response.headers['last-modified']);
                callback(null, body, modified_date);
            } else {
                console.log("Error", err, response.statusCode, body);
                callback(response.statusCode + ':' + body.message, null, null);
            }
        });
    },

    negotiateContent: function(request_path, file_extension, request_options, callback) {
        var self = this;
        var error = null;
        var collected_contents = {};
        var content_options = {};
        var last_modified = new Date().getTime();

        var path = request_path.substr(1);

        // fetch content
        self.getContent(path, function(err, contents, modified_date) {
            if (!err) {
                collected_contents = _.extend(collected_contents, contents);

                // fetch and mix shared content
                default_content_handler.getSharedContent(function(err, shared_content, shared_modified_date) {
                    if (!err) {
                        collected_contents = _.extend(collected_contents, shared_content);
                        if (shared_modified_date > last_modified) {
                            last_modified = shared_modified_date;
                        }
                    }        
                });
                return callback(error, collected_contents, content_options, last_modified);
            } else {
                // falback: default content_handler
                default_content_handler.negotiateContent(request_path, file_extension, request_options, callback);
            }
        });

    },
    
    getSections: function(callback) {
        default_content_handler.getSections(callback);
    },

    getContentPaths: function(basepath, callback) {
        var self = this;
        default_content_handler.getContentPaths(basepath, function(err, collected_paths) {
          if (basepath.match(/^\/$/)) {
              self.getPosts(function(err, posts_obj, posts_last_modified) {
                  if (!err) {
                      var all_posts = posts_obj.items;
                      _.each(all_posts, function(post_contents) {
                          if (post_contents.labels && post_contents.labels.indexOf("yoga-azbuka") != -1) {
                              collected_paths.push('/blog/' + post_contents.id);
                          }
                      });
                  } else {
                      console.log("Error", err);
                  }
                  callback(err, collected_paths);
              });
          } else {
              callback(err, collected_paths);
          }
        });
  }
};