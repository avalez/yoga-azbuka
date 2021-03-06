var fs = require('fs');
var iconv = require('iconv-lite');

module.exports = {

  outputDir: null,
  paths: [],

  setup: function (config) {
    this.outputDir = config.output_dir;
    this.paths = config.utf8_paths || [];
    iconv.skipDecodeWarning = true;
  },

  run: function (path, options, cb) {
    if (!~this.paths.indexOf(path)) return cb();
    if (this.isFixed(path)) return cb();

    var modified = options.modified || false;
    var finished = options.finished || false;

    var filepath = this.outputDir + path;
    var a = fs.readFileSync(filepath, 'binary');
    var b = iconv.decode(a, 'utf8');
    fs.writeFileSync(filepath, b, 'binary');

    this.setFixed(path);

    return cb();
  },

  // Note: we have to use a persistent registry to remember if a file was already fixed or not
  getFixed: function () {
    try {
      return JSON.parse(fs.readFileSync(this.outputDir + '.fix_utf8'));
    } catch (e) {
      return {};
    }
  },
  isFixed: function (path) {
    var fixed = this.getFixed();
    if (!fixed[path]) return false;
    var mtime = fs.statSync(this.outputDir + path).mtime;
    return fixed[path] > +mtime;
  },
  setFixed: function (path) {
    var fixed = this.getFixed();
    fixed[path] = Date.now();
    fs.writeFileSync(this.outputDir + '.fix_utf8', JSON.stringify(fixed));
  }

};
