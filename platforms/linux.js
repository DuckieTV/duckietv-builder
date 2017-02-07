require('shelljs/global');
var shared = require('../shared'),
    buildUtils = require('../util');


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
            if (options.nightly) {
                shared.addNightlyStrings(BUILD_DIR);
            }
        },
        makeBinary: function(options) {

            ARCHITECTURES.map(function(arch) {
                var ARCH_BUILD_DIR = BUILD_DIR + "-" + arch + "/DuckieTV";

                // create output dir for platform
                mkdir("-p", ARCH_BUILD_DIR);

                // copy generic sources 
                cp('-r', BUILD_DIR + "/*", BUILD_DIR + "-" + arch + "/DuckieTV")

                cp('-r', __dirname + "/linux/*", BUILD_DIR + "-" + arch);

                // download and extract nwjs
                var EXTRACTED_NWJS = require('../nwjs-downloader')
                    .setDebug(options.nightly)
                    .setPlatform('linux')
                    .setArchitecture(arch)
                    .get();

                cp('-r', EXTRACTED_NWJS + "/*", ARCH_BUILD_DIR);
                //rename nw executable to DuckieTV-bin, so the wrapper script can run
                mv(ARCH_BUILD_DIR + "/nw", ARCH_BUILD_DIR + "/DuckieTV-bin");
                echo(BUILD_DIR + "-" + arch);

                pushd(BUILD_DIR + "-" + arch);

                cat('setup')
                    .replace(/{{VERSION}}/g, shared.getVersion())
                    .replace(/{{NIGHTLY}}/g, options.nightly ? " Nightly" : "")
                    .to('setup');
                cat('README')
                    .replace(/{{VERSION}}/g, shared.getVersion())
                    .replace(/{{NIGHTLY}}/g, options.nightly ? " Nightly" : "")
                    .to('README');
                exec("chmod -R 0755 share/*");
                popd();

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
        publish: function(options) {

            return ARCHITECTURES.map(function(arch) {
                return buildUtils.buildFileName(PACKAGE_FILENAME, arch);
            });

        }
    }

};