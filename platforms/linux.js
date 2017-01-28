require('shelljs/global');
var shared = require('../shared'),
    buildUtils = require('../util');


/**
 * DuckieTV linux build processor.
 * The linux build processor makes a generic linux binary and creates a .tgz with a setup script
 */

var BUILD_DIR = shared.BUILD_DIR + '/linux';
var PACKAGE_FILENAME = 'DuckieTV-%VERSION%-linux-%ARCHITECTURE%.tar.gz';
var ARCHITECTURES = ['ia32', 'x64'];

module.exports = {

    processor: {

        preProcess: function(options) {
            shared.modifyPackageJSON(options, BUILD_DIR);
            shared.patchManifest(BUILD_DIR, ['dist/background.js']);
        },
        makeBinary: function(options) {

            ARCHITECTURES.map(function(arch) {
                var ARCH_BUILD_DIR = BUILD_DIR + "-" + arch;

                // create output dir for platform
                mkdir("-p", ARCH_BUILD_DIR);

                // copy generic sources 
                cp('-r', BUILD_DIR + "/*", ARCH_BUILD_DIR)

                // copy sources from __dirname+"/resources" to ARCH_BUILD_DIR

                // download and extract nwjs
                var EXTRACTED_NWJS = require('../nwjs-downloader')
                    .setDebug(options.nightly)
                    .setPlatform('linux')
                    .setArchitecture(arch)
                    .get();

                cp('-r', EXTRACTED_NWJS + "/*", ARCH_BUILD_DIR);

                pushd(ARCH_BUILD_DIR);

                // replace version, architecture and nightly variables
            });

        },
        packageBinary: function(options) {
            ARCHITECTURES.map(function(arch) {
                echo("Packing linux " + arch);
                var targetFileName = buildUtils.buildFileName(PACKAGE_FILENAME, arch);
                buildUtils.tgzBinary('linux-' + arch, targetFileName);
                echo("Packaging linux " + arch + " done.");
            });
        },
        deploy: function(options) {


            if (options.nightly && options.deploy) {
                //pushToGithub();
            }


        }
    }

};