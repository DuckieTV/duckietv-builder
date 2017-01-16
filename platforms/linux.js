require('shelljs/global');
var shared = require('../shared'),
    buildUtils = require(' ../util');


/**
 * DuckieTV linux build processor.
 * The linux build processor makes a generic linux binary and creates a .tgz with a setup script
 */

var BUILD_DIR = shared.BUILD_DIR + '/linux';
var PACKAGE_FILENAME = 'DuckieTV-%VERSION%-linux-%ARCHITECTURE%.tar.gz';
var ARCHITECTURES = ['x32', 'x64'];

module.exports = {

    processor: {

        preProcess: function(options) {
            shared.modifyPackageJSON(options, BUILD_DIR);
            shared.patchManifest(BUILD_DIR, ['dist/background.js']);
        },
        makeBinary: function(options) {


        },
        packageBinary: function(options) {
            ARCHITECTURES.map(function(arch) {
                echo("Packing linux " + arch);
                var targetFileName = util.buildFilename(PACKAGE_FILENAME, ARCHITECTURE);
                buildUtils.tgzBinary('linux-' + arch, targetFileName);
                echo("Packaging linux " + arch + " done.");
            });
        }
        deploy: function(options) {


            if (options.nightly && options.deploy) {
                //pushToGithub();
            }


        }
    }

};