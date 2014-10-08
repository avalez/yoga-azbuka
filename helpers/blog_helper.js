var _ = require("underscore");
var path = require("path");

var helper_utils = require("punch").Utils.Helper;
var path_utils = require("punch").Utils.Path;
var blog_content_handler = require("../lib/rest_content_handler");

var homepage_posts = 10;
var teaser_length = 2;
var recent_posts = [];
var last_modified = null;

var fetch_content = function(callback) {
    recent_posts = [];

    //reset posts list
    blog_content_handler.allPosts = {};

    blog_content_handler.getPosts(function(err, posts_obj, posts_last_modified) {
        if (!err) {
            var all_posts = posts_obj.items;

            last_modified = posts_last_modified;

            var recent_posts_list = all_posts.length > homepage_posts ? all_posts.slice(all_posts.length - homepage_posts) : all_posts;

            _.each(all_posts, function(post_contents) {
                if (!post_contents.labels || post_contents.labels.indexOf("yoga-azbuka") == -1) {
                    return;
                }

                var post_paras = post_contents.content.replace(/\n/g, " ").match(/(<p[^>]*>.*?<\/p>)/g);
                if (!post_paras) {
                    post_paras = [post_contents.content];
                }

                if (teaser_length < 1) {
                    paras_to_show = post_paras.length;
                } else {
                    paras_to_show = teaser_length;
                }

                post_contents.is_teaser = (paras_to_show < post_paras.length);
                post_contents.content = post_paras.slice(0, paras_to_show).join("");

                recent_posts.push(post_contents);

            });

            return callback();

        } else {
            console.log(err);
            return callback();
        }
    });
}

var tag_helpers = {

    recent_posts: function() {
        return recent_posts;
    }

};

module.exports = {

    setup: function(config) {
        if (config.blog) {
            teaser_length = config.blog.teaser_length;
            homepage_posts = config.blog.homepage_posts;
        }
    },

    directAccess: function(){
        return { "block_helpers": {}, "tag_helpers": {}, "options": {} };
    },

    get: function(basepath, file_extension, options, callback){
        var self = this;

        if (!path_utils.matchPath(basepath, "^/blog/index$")) {
            return callback(null, {}, {}, null);
        }

        fetch_content(function() {
            return callback(null, { "tag": tag_helpers }, {}, last_modified);
        });
    }

}
