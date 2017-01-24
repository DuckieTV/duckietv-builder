require('shelljs/global');
var shared = require('../shared'),
    buildUtils = require('../util'),
    yesno = require('yesno');

/**
 * DuckieTV osx build processor.
 * The osx build processor makes a generic x64 
 */
var BUILD_DIR = shared.BUILD_DIR + '/osx';
var BINARY_OUTPUT_DIR = shared.BINARY_OUTPUT_DIR + '/DuckieTV.app';
var PACKAGE_FILENAME = 'DuckieTV-%VERSION%-OSX-%ARCHITECTURE%.pkg';
var ARCHITECTURE = 'x64';

/**
 * Check and make sure that nwjs is cached and extracted
 for use
 */
function downloadAndExtractNWJS(debug) {

    if (!test('-d', shared.NWJS_DOWNLOAD_DIR)) {
        mkdir(shared.NWJS_DOWNLOAD_DIR);
    }
    pushd(shared.NWJS_DOWNLOAD_DIR);

    var flavour = "nwjs" + (debug ? '-sdk' : '') + '-v' + shared.NWJS_VERSION + "-osx-x64",
        url = "https://dl.nwjs.io/v" + shared.NWJS_VERSION + "/" + flavour + ".zip",
        downloaded = test('-f', flavour + '.zip'),
        extracted = test('-d', flavour);


    if (!downloaded) {
        echo(flavour + " not yet found. Downloading from " + url);
        exec("curl -O " + url);
    }

    if (!extracted) {
        echo(flavour + " is not yet extracted.. extracting.");
        exec("unzip " + flavour + ".zip");
    }
    popd();
    return shared.NWJS_DOWNLOAD_DIR + "/" + flavour + "/nwjs.app";
}

module.exports = {

    processor: {

        preProcess: function(options) {
            shared.modifyPackageJSON(options, BUILD_DIR);
            shared.patchManifest(BUILD_DIR, ['dist/background.js']);
        },

        makeBinary: function(options) {

            // download nwjs if not cached
            var nwjspath = downloadAndExtractNWJS(options.nightly);
            // default dir to copy the previously built duckietv sources to
            var NWJS_APP_DIR = BINARY_OUTPUT_DIR + '/Contents/Resources/app.nw';

            // cleanup
            rm('-rf', BINARY_OUTPUT_DIR);
            // re-init
            mkdir('-p', BINARY_OUTPUT_DIR);
            // copy default nwjs installation
            cp('-r', nwjspath + '/*', BINARY_OUTPUT_DIR);
            // create folder app.nw in nwjs.app/Contents/Resources/
            mkdir('-p', NWJS_APP_DIR);
            // copy output/osx/* to nwjs.app/Contents/Resources/
            cp('-r', BUILD_DIR + '/*', NWJS_APP_DIR)
                // patch Contents/info.plist with version number and stuff

            // copy osx/duckietv.icns to Contents/Resources/nw.icns
            cp(__dirname + '/osx/duckietv.icns', BINARY_OUTPUT_DIR + '/Contents/Resources/nw.icns');

            cat(__dirname + '/osx/Info.plist').replace("{{VERSION}}", shared.getVersion()).to(BINARY_OUTPUT_DIR + "/Contents/Info.plist")
            echo("Done making binary");
        },
        packageBinary: function(options) {

            if (!which('bomutils')) {
                yesno.ask('BomUtils is required if you want to build OSX .pkg files. Do you wish to install this now?', true, function(ok) {
                    if (ok) {
                        exec("git clone https://github.com/hogliux/bomutils");
                        cd("bomutils");
                        exec("make");
                        exec("sudo make install");
                    }
                });
            }


            if (!which('xar')) {
                yesno.ask('"xar is required if you want to build OSX .pkg files Do you wish to install this now?', true, function(ok) {
                    if (ok) {
                        exec("wget https://github.com/mackyle/xar/archive/xar-1.6.1.tar.gz");
                        exec("tar -zxvf ./xar-1.6.1.tar.gz");
                        exec("cd xar-xar-1.6.1/xar");
                        exec("./autogen.sh");
                        exec("make");
                        exec("sudo make install")
                    }
                });
                process.exit();
            }


            var targetFileName = util.buildFilename(PACKAGE_FILENAME, ARCHITECTURE);
            var config = {
                "NAME": "", // Application name (no spaces): 
                "APP_NAME": "", // DuckieTV.app
                "PKG_NAME": "", // DuckieTV.pkg
                "VERSION": "", // Application version: " -i "1.0.0
                "DESCRIPTION": "", // Application description: " -i "${CONF_NAME} v${CONF_VERSION} Application
                "SRC": "", // Application src directory path: 
                "ICON_PNG": "", // PNG icon path: 
                "ICON_OSX": "", // OSX icon (.icns) path: 
                "osxBgPath": "", // OSX .pkg background file path
                "CFBundleIdentifier": "", // OSX CFBundleIdentifier: 
                "LICENSE": "", // License file path: 
                "OUTPUT_DIR": "" // where to place the output file
            };


            // cd $workingdir


            var WORK_DIR = tempdir() + '/nwjs-osx-on-linux-builder';
            var APP_BUILD_DIR = WORK_DIR + '/root/Applications';
            var RESOURCE_DIR = __dirname + "/resources";


            rm('-rf', WORK_DIR); // init work dir
            mkdir(WORK_DIR);

            cp('-r', RESOURCE_DIR + '/*', WORK_DIR); // initialize base directory structure
            cp('-r', config.APP_SOURCE_DIR, APP_BUILD_DIR); // copy source files to installer base

            cd(APP_BUILD_DIR);

            // put optional setup background in place
            if (config.SETUP_BG_PNG && test('-f', config.SETUP_BG_PNG)) {
                cp(config.SETUP_BG_PNG, APP_BUILD_DIR + "/flat/Resources/en.lproj/background");
            } else {
                echo("Could not locate background png file: " + config.SETUP_BG_PNG);
                delete config.SETUP_BG_PNG;
            }

            chmod('-R a+xr', config.APP_NAME); // fix permissions

            // replace config variables in flat/base.pkg/PackageInfo and flat/Distribution
            patchTemplate(APP_BUILD_DIR + "/flat/base.pkg/PackageInfo", config);
            patchTemplate(APP_BUILD_DIR + "/flat/Distribution", config);

            // count files and install size and insert them in the install script
            config.FILES_COUNT = exec("find " + config.APP_NAME + "/root | wc -l");
            config.LOCAL_INSTALL_KB_SIZE = exec("du -k -s " + config.APP_NAME + "/root | awk '{print $1}'");

            // package payload
            cd(APP_BUILD_DIR + "/" + config.APP_NAME + "/root");
            exec("(find . | cpio -o --format odc --owner 0:80 | gzip -c )").to(APP_BUILD_DIR + "/" + config.APP_NAME + "/flat/base.pkg/Payload");

            // create bill of materials
            exec("mkbom -u 0 -g 80$ " + APP_BUILD_DIR + "/flat/base.pkg/Bom");
            cd(APP_BUILD_DIR + "/flat");
            // store files using xar
            var OUTPUT_FILE_NAME = config.OUTPUT_DIR + "/" + config.NAME + "-" + config.version + "-OSX.pkg";
            exec("xar --compression none -cf " + OUTPUT_FILE_NAME + " *");

            echo("Done building for OSX, see " + OUTPUT_FILE_NAME);

        },
        deploy: function(options) {

            if (options.nightly && options.deploy) {
                //pushToGithub();
            }


        }
    }

};