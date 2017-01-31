require('shelljs/global');
var shared = require('../shared'),
    buildUtils = require('../util');

config.verbose = true;

/**
 * DuckieTV windows build processor.
 * The windows build processor makes a x32 and x64 binary and runs the output through NSIS to create a nice setup installer.
 */

var BUILD_DIR = shared.BUILD_DIR + '/windows';
var PACKAGE_FILENAME = 'DuckieTV-%VERSION%-windows-%ARCHITECTURE%.zip';
var INSTALLER_FILENAME = 'DuckieTV-%VERSION%-windows-%ARCHITECTURE%.exe';
var ARCHITECTURES = ['ia32', 'x64'];

module.exports = {

    processor: {

        preProcess: function(options) {
            shared.modifyPackageJSON(options, BUILD_DIR);
            shared.patchManifest(BUILD_DIR, ['dist/background.js']);
        },

        makeBinary: function(options) {


            ARCHITECTURES.map(function(arch) {
                var ARCH_BUILD_DIR = BUILD_DIR + "-" + arch + "/DuckieTV";

                // create output dir for platform
                mkdir("-p", ARCH_BUILD_DIR);

                // copy generic sources 
                cp('-r', BUILD_DIR + "/*", BUILD_DIR + "-" + arch + "/DuckieTV")

                cp('-r', __dirname + "/windows/*", BUILD_DIR + "-" + arch);

                // download and extract nwjs
                var EXTRACTED_NWJS = require('../nwjs-downloader')
                    .setDebug(options.nightly)
                    .setPlatform('win')
                    .setArchitecture(arch)
                    .get();

                cp('-r', EXTRACTED_NWJS + "/*", ARCH_BUILD_DIR);
                //rename nw executable to DuckieTV-bin, so the wrapper script can run
                mv(ARCH_BUILD_DIR + "/nw.exe", ARCH_BUILD_DIR + "/DuckieTV.exe");

                pushd(BUILD_DIR + "-" + arch);

                cat('DuckieTV/app.nsi')
                    .replace(/{{ARCHITECTURE}}/g, arch)
                    .replace(/{{ICONFILE}}/g, 'img/favicon.ico')
                    .replace(/{{LICENSE}}/g, 'LICENSE.md')
                    .replace(/{{VERSION}}/g, shared.getVersion())
                    .replace(/{{NIGHTLY}}/g, options.nightly ? "Nightly " : "")
                    .replace(/{{SETUP_OUTPUT_FILENAME}}/g, buildUtils.buildFileName(INSTALLER_FILENAME, arch))
                    .to('DuckieTV/app.nsi');

                // hijack resourcehacker nodejs module's executable so we can pipe it through sync exec() function
                var path = require('path');
                pushd('DuckieTV');
                var RESHACKER_PATH = path.join(path.dirname(require.resolve('resourcehacker')), '../bin/ResourceHacker.exe');
                exec("wine " + RESHACKER_PATH + ' -addoverwrite "DuckieTV.exe","DuckieTV.exe","img/favicon-inverted.ico",ICONGROUP,IDR_ALT_ICON,0');
                exec("wine " + RESHACKER_PATH + ' -addoverwrite "DuckieTV.exe","DuckieTV.exe","img/favicon.ico",ICONGROUP,IDR_MAINFRAME,1033');
                exec("wine " + RESHACKER_PATH + ' -addoverwrite "DuckieTV.exe","DuckieTV.exe","img/favicon.ico",ICONGROUP,IDR_X001_APP_LIST,1033');
                exec("wine " + RESHACKER_PATH + ' -addoverwrite "DuckieTV.exe", "DuckieTV.exe", "' + __dirname + '/windows/fileinfo.res", VERSIONINFO, 1, 1033');
                exec("makensis app.nsi");
                mv(buildUtils.buildFileName(INSTALLER_FILENAME, arch), '..');
                popd();
                popd();

            });
        },
        packageBinary: function(options) {
            ARCHITECTURES.map(function(arch) {
                echo("Packing windows " + arch);
                var targetFileName = buildUtils.buildFileName(PACKAGE_FILENAME, arch);
                var installerFile = buildUtils.buildFileName(INSTALLER_FILENAME, arch);
                buildUtils.zipBinary('windows-' + arch, targetFileName, '*.exe');
                echo("Packaging windows " + arch + " done.");
            });

        },
        deploy: function(options) {
            ARCHITECTURES.map(function(arch) {

                if (options.nightly && options.deploy) {
                    buildUtils.publishFileToGithubTag('DuckieTV/Nightlies', options.GITHUB_TAG, shared.OUTPUT_DIR + '/' + buildUtils.buildFilename(PACKAGE_FILENAME));
                }

                if (!options.nightly && options.deploy && options.iamsure) {
                    buildUtils.publishFileToGithubTag('SchizoDuckie/DuckieTV', options.GITHUB_TAG, shared.OUTPUT_DIR + '/' + buildUtils.buildFilename(PACKAGE_FILENAME));
                }


            });

        }
    }

};