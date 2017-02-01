require('shelljs/global');
var shared = require('./shared');

module.exports = {

    /**
     * Generic output build filename builder
     */
    buildFileName: function(input, architecture) {
        return input.replace('%VERSION%', shared.getVersion()).replace('%ARCHITECTURE%', architecture);
    },


    zipBinary: function(build, zipfilename, filemask) {
        echo("Building zip: " + zipfilename);
        pushd(shared.BUILD_DIR + "/" + build);
        exec('zip -q -r ' + shared.BINARY_OUTPUT_DIR + "/" + zipfilename + " " + (filemask || '*'));
        echo("Done. " + zipfilename);
        popd();
    },

    tgzBinary: function(build, tgzfilename) {
        echo("Building tgz: " + tgzfilename);
        pushd(shared.BUILD_DIR + "/" + build);
        exec("tar -czf " + shared.BINARY_OUTPUT_DIR + "/" + tgzfilename + " " + '*');
        echo("Done. " + tgzfilename);
        popd();
    }
}