require('shelljs/global');
var shared = require('../shared'),
    buildUtils = require('../util');
/**
 * DuckieTV osx build processor.
 * The osx build processor makes a generic x64 
 */
var BUILD_DIR = shared.BUILD_DIR + '/osx';
var BINARY_OUTPUT_DIR = shared.BUILD_DIR + '/DuckieTV.app';
var PACKAGE_FILENAME = 'DuckieTV-%VERSION%-OSX-%ARCHITECTURE%.pkg';
var ARCHITECTURE = 'x64';


module.exports = {

    processor: {

        preProcess: function(options) {
            shared.modifyPackageJSON(options, BUILD_DIR);
            shared.patchManifest(BUILD_DIR, shared.getManifestBackgroundScriptArray(BUILD_DIR + '/manifest.json', 'dist/'));
            if (options.nightly) {
                shared.addNightlyStrings(BUILD_DIR);
            }
        },

        makeBinary: function(options) {

            // default dir to copy the previously built duckietv sources to
            var NWJS_APP_DIR = BINARY_OUTPUT_DIR + '/Contents/Resources/app.nw';

            // download nwjs if not cached

            var EXTRACTED_NWJS = require('../nwjs-downloader')
                .setDebug(options.nightly)
                .setPlatform('osx')
                .setVersion(shared.NWJS_VERSION)
                .setArchitecture(ARCHITECTURE)
                .get() + '/nwjs.app';

            // cleanup
            rm('-rf', BINARY_OUTPUT_DIR);
            // re-init
            mkdir('-p', BINARY_OUTPUT_DIR);
            // copy default nwjs installation
            cp('-r', EXTRACTED_NWJS + '/*', BINARY_OUTPUT_DIR);
            // create folder app.nw in nwjs.app/Contents/Resources/
            mv(BINARY_OUTPUT_DIR + '/Contents/MacOS/nwjs', BINARY_OUTPUT_DIR + '/Contents/MacOS/DuckieTV')
            mkdir('-p', NWJS_APP_DIR);
            // copy output/osx/* to nwjs.app/Contents/Resources/
            cp('-r', BUILD_DIR + '/*', NWJS_APP_DIR)

            // copy osx/duckietv.icns to Contents/Resources/nw.icns
            cp(__dirname + '/osx/duckietv.icns', BINARY_OUTPUT_DIR + '/Contents/Resources/app.icns');

            // patch Contents/info.plist with version number and stuff
            cat(__dirname + '/osx/Info.plist')
                .replace(/{{VERSION}}/g, shared.getVersion())
                .replace(/{{NIGHTLY}}/g, options.nightly ? " Nightly" : "")
                .to(BINARY_OUTPUT_DIR + "/Contents/Info.plist")
            echo("Done making binary");
        },
        packageBinary: function(options) {

            var ok = true;
            if (!which('mkbom')) {
                echo("\n\nBomUtils is required if you want to build OSX .pkg files. You can install it by executing:\n");
                echo("git clone https://github.com/hogliux/bomutils && cd bomutils && make && sudo make install");
                ok = false;
            }

            if (!which('xar')) {
                echo("\n\nxar is required if you want to build OSX .pkg files. You can install it by executing:\n");
                echo("curl -L https://github.com/mackyle/xar/archive/xar-1.6.1.tar.gz | tar -xz && cd xar\*/xar && ./autogen.sh && make && sudo make install");
                ok = false;
            }

            if (!ok) {
                process.exit();
            }


            var targetFileName = buildUtils.buildFileName(PACKAGE_FILENAME, ARCHITECTURE);
            echo("Packaging: " + targetFileName);
            var WORK_DIR = shared.BUILD_DIR + '/osx-installer';
            var APP_BUILD_DIR = WORK_DIR + '/root/Applications/DuckieTV.app/';
            var RESOURCE_DIR = __dirname + "/osx/build";

            rm('-rf', WORK_DIR); // init work dir
            mkdir('-p', WORK_DIR);
            mkdir('-p', APP_BUILD_DIR);

            cp('-r', RESOURCE_DIR + '/*', WORK_DIR); // initialize base directory structure
            cp('-r', BINARY_OUTPUT_DIR + '/*', APP_BUILD_DIR); // copy source files to installer base
            mkdir('-p', BINARY_OUTPUT_DIR);
            cd(APP_BUILD_DIR);

            // count files and install size and insert them in the install script
            echo("Counting files: ");
            var FILES_COUNT = exec("find " + WORK_DIR + "/root | wc -l").trim();
            echo("Determining full install size in KB");
            var LOCAL_INSTALL_KB_SIZE = exec("du -k -s " + WORK_DIR + "/root | awk '{print $1}'").trim();

            cat(WORK_DIR + "/flat/Distribution")
                .replace('{{VERSION}}', shared.getVersion())
                .replace('{{NIGHTLY}}', options.nightly ? " Nightly" : "")
                .replace('{{INSTALL_KB_SIZE}}', LOCAL_INSTALL_KB_SIZE)
                .to(WORK_DIR + "/flat/Distribution");

            // replace config variables in flat/base.pkg/PackageInfo and flat/Distribution
            cat(WORK_DIR + "/flat/base.pkg/PackageInfo")
                .replace('{{VERSION}}', shared.getVersion())
                .replace('{{NIGHTLY}}', options.nightly ? " Nightly" : "")
                .replace('{{INSTALL_KB_SIZE}}', LOCAL_INSTALL_KB_SIZE)
                .replace('{{COUNT_FILES}}', FILES_COUNT)
                .to(WORK_DIR + "/flat/base.pkg/PackageInfo");

            // fix permissions
            exec('chmod -R 775 ' + WORK_DIR + '/*');

            // package payload

            cd(WORK_DIR + "/root");
            exec("(find . | cpio -o --format odc --owner 0:80 | gzip -c )> " + WORK_DIR + "/flat/base.pkg/Payload");

            // create bill of materials
            exec("mkbom -u 0 -g 80 . " + WORK_DIR + "/flat/base.pkg/Bom");
            pushd(WORK_DIR + "/flat");
            // store files using xar, save it as .pkg file
            exec("xar --compression none -cf " + shared.BINARY_OUTPUT_DIR + "/" + targetFileName + " *");

            echo("Done building for OSX, see " + shared.BINARY_OUTPUT_DIR + "/" + targetFileName);

        },
        publish: function(options) {
            return [buildUtils.buildFileName(PACKAGE_FILENAME, 'x64')];
        }

    }
};