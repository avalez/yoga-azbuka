var _ = require("underscore");
var gift = require('gift')
var DeepFstream = require("punch").Utils.DeepFstream;
var Path = require("path");
var fs = require('fs-extra');

module.exports = {
    
    repo: null,

    lastPublishedDate: null,

    publishOptions: null,

    repo_url: null,

    repo_dir: null,

    branch: null,

    retrieveOptions: function(supplied_config) {
        var self = this;
        var error = "Cannot find git publisher settings in config";

        if (_.has(supplied_config, "publish") && _.has(supplied_config["publish"], "options")) {
            return supplied_config["publish"]["options"];
        } else {
            throw error;
        }
    },

    isModified: function(modified_date) {
        var self = this;

        return ( modified_date > self.lastPublishedDate    );
    },
    
    copyFiles: function(supplied_config, complete) {
        var self = this;
        var output_dir = (supplied_config && supplied_config.output_dir) || "";
        var output_dir_path = Path.join(process.cwd(), output_dir);
        var file_stream = new DeepFstream(output_dir_path);

        file_stream.on("directory", function(entry, callback) {
            return callback();
        });

        file_stream.on("file", function(entry, callback) {
            if (self.isModified(entry.props.mtime)) {
                var entry_path = Path.relative(output_dir_path, entry.path);
                var source_path = Path.join(output_dir, entry_path);
                var target_path = Path.join(self.repo.path, entry_path);
                return fs.copy(source_path, target_path, function(err) {
                    if (err) {
                        throw new Error("Error occured on copying file.");   
                    }
                    self.repo.add(entry_path, callback);
                });
            } else {
                return callback();
            }
        });

        file_stream.on("end", function() {
            return self.repo.status(function(err, status) {
                if (err) {
                    throw new Error("Error checking repo status before commit.");   
                } else if (!status.clean) {
                    return self.repo.commit("automatic commit by " + (process.env.BUILD_TAG || 'punch-git-publisher') , function(err) {
                        if (err) {
                            throw new Error("Error comitting update.");   
                        } else {
                            self.repo.remote_push('origin', function(err) {
                                if (err) {
                                    throw new Error("Error pushing update.");   
                                } else {
                                    complete();
                                }
                            });
                        }
                    });
                } else {
                    complete();
                }
            });
        });
    },

    fetch: function(supplied_config, callback) {
        var self = this;

        self.repo = gift(self.repo_dir);

        return self.repo.status(function(err, status) {
            if (err) {
                gift.clone(self.repo_url, self.repo_dir, function(err, repo) {
                    if (err) {
                        throw new Error("Error cloning git repository.");   
                    }
                    self.repo = repo;
                    console.log('Cloned %s', self.repo_url)
                    self.repo.checkout(self.branch, function(err, heads) {
                        if (err) {
                            console.log(err);
                            throw new Error("Error getting branch.");   
                        }
                        return self.copyFiles(supplied_config, callback);
                    });
                });
            } else {
                self.repo.sync('origin', self.branch, function(err) {
                    if (err) {
                        console.log(err);
                        throw new Error("Error syncing git repository.");   
                    }
                    console.log('Synced %s', self.repo_dir)
                    return self.copyFiles(supplied_config, callback);
                });
            }
        });
    },

    publish: function(supplied_config, last_published_date, callback) {
        var self = this;

        self.publishOptions = self.retrieveOptions(supplied_config);

        self.lastPublishedDate = last_published_date;

        self.repo_url = self.publishOptions.repo_url;

        if (!self.repo_url) {
            throw new Error("repo_url config option is requires");   
        }

        self.repo_dir = (self.publishOptions.repo_dir) || "target";

        self.branch = self.publishOptions.branch || 'master';

        return self.fetch(supplied_config, callback);

        /*
        fs.stat(self.repo_dir, function(err, repo_dir_stat) {
            if (!err) {
                fs.remove(self.repo_dir, function(err) {
                    if (err) {
                        throw new Error(err);
                    }
                    return self.fetch(supplied_config, callback);
                });
            } else {
                return self.fetch(supplied_config, callback);
            }
        });
        */

    }
    
};


