require('shelljs/global')

var shared = require('../shared'),
    request = require('superagent'),
    buildUtils = require('../util');

/**
 * DuckieTV Android (Cordova) build processor.
 * The Cordova/Android build step has some quirks:
 * - there cannot be folders starting with _
 * - tab.html should be index.html
 *
 * To mitigate these, this processor iterates through the relevant files and does raw string replaces
 * Renames the directory with locales
 * And renames the tab.html to index.html
 *
 * Also, a meta viewport tag is inserted to make sure duckietv scales properly.
 */

var BUILD_DIR = shared.BUILD_DIR + '/android';
var PACKAGE_FILENAME = 'DuckieTV-%VERSION%-android.apk';
var PHONEGAP_DOWNLOAD_URL = "https://build.phonegap.com/apps/1473540/download/android";

module.exports = {

    processor: {

        preProcess: function(options) {

            patchTab();
            renameTab();
            patchAppJS();
            patchDepsJS();
            renameLocalesDir();
            shared.patchManifest(BUILD_DIR, ['dist/background.js', 'dist/launch.js']);

        },

        /**
         * The cordova build process is outsourced to Phonegap Build.
         * We trigger a refresh and build there and wait for it to complete for 3 0fsaeconds (builds usally take 5 sec)
         */
        makeBinary: function(options) {
            initRepository();
            pushToCordovaGithub();
            try {
                triggerPhonegapBuild();
            } catch (e) {
                echo(e);
            }
        },

        /**
         * Download the previously triggered phonegapbuild to the output dir
         */
        packageBinary: function() {
            pushd(shared.BINARY_OUTPUT_DIR)
            exec("curl -L -o " + buildUtils.buildFileName(PACKAGE_FILENAME) + " " + PHONEGAP_DOWNLOAD_URL);
            popd();
        },
        deploy: function(options) {

            if (options.nightly && options.deploy) {
                buildUtils.publishFileToGithubTag('DuckieTV/Nightlies', options.GITHUB_TAG, shared.OUTPUT_DIR + '/' + buildUtils.buildFilename(PACKAGE_FILENAME));
            }

            if (!options.nightly && options.deploy && options.iamsure) {
                buildUtils.publishFileToGithubTag('SchizoDuckie/DuckieTV', options.GITHUB_TAG, shared.OUTPUT_DIR + '/' + buildUtils.buildFilename(PACKAGE_FILENAME));
            }

            if (options.deployDemo) {

            }
        }
    }

};

function downloadPhonegapBuild(target_dir) {
    pushd(target_dir);
}


/**
 * Give the android build a dedicated viewport so that it looks the same on each device.
 * (We have no scalable UI for phones)
 */
function patchTab() {
    cat(BUILD_DIR + '/tab.html')
        .replace('</head>', '<meta name="viewport" content="width=1920,height=1080,target-densitydpi=device-dpi,user-scalable=yes" /></head>')
        .to(BUILD_DIR + '/tab.html');
}

/**
 * Rename tab.html to index.html for browsers.
 */
function renameTab() {
    mv(BUILD_DIR + '/tab.html', BUILD_DIR + '/index.html');
}

/**
 * Perform nasteh string replace on dist/app.js to replace _locales with locales
 */
function patchAppJS() {
    cat(BUILD_DIR + '/dist/app.js').replace('_locales', 'locales').to(BUILD_DIR + '/dist/app.js');
}

/**
 * Perform nasteh string replace on dist/deps.js to replace _locales with locales
 */
function patchDepsJS() {
    cat(BUILD_DIR + '/dist/deps.js').replace('_locales/angular-locale_{{locale}}.js', 'locales/angular-locale_{{locale}}.js').to(BUILD_DIR + '/dist/deps.js');
}

/**
 * Rename the _locales dir to locales because the android apps (and also github pages) will handle them properly.
 * Hacky as fuk.
 */
function renameLocalesDir() {
    mv(BUILD_DIR + '/_locales', BUILD_DIR + '/locales');
}

/**
 * Init a fresh git repo without history to be able to push to the remotes.
 */
function initRepository() {
    cd(BUILD_DIR);
    rm('-rf', './.git');
    exec('git init');
    exec('git remote add origin git@github.com:SchizoDuckie/DuckieTV-Cordova.git');
    exec('git remote add duckietv git@github.com:DuckieTV/DuckieTV.git');
    exec('git add .');
    exec('git commit -m "Android deployment."');
}

/**
 * Pushes to cordova github repo. This a repo dedicated to the phonegap build.
 * Phonegap build does a fresh clone from this repo before building.
 */
function pushToCordovaGithub() {
    cd(BUILD_DIR);
    echo('pushing to SchizoDuckie/DuckieTV-Cordova:master');
    echo('git push --force origin master');
}


/**
 * The cordova build doubles as the 'demo', which is hosted on github pages.
 */
function pushToGithub() {
    cd(BUILD_DIR);
    echo('pushing to DuckieTV/DuckieTV:gh-pages');
    echo('git push --force duckietv master:gh-pages');
}

/**
 * - Login with the auth token on phonegap build.
 * - Update the repository 
 * - Unlock the signing key
 * - Queue a build
 * @return    promise  Build was queued
 */

function triggerPhonegapBuild() {

    var credentials = shared.getCredentials();
    var token = '?auth_token=' + credentials.PHONEGAP_API_TOKEN;
    echo("Updating Phonegap Build repo");

    return request.put('https://build.phonegap.com/api/v1/apps/1473540' + token)
        .set("Accept", 'application/json')
        .send('data={"pull": "true"}')
        .then(function(response, err) {
            echo("Phonegap Build Repo Update started.");
            echo("Unlocking signing key.");
            return request.put('https://build.phonegap.com/api/v1/apps/1473540' + token)
                .set("Accept", 'application/json')
                .send('data={"keys": {"android": { "id": "' + credentials.ANDROID_KEYSTORE_ID + '", "key_pw": "' + credentials.ANDROID_KEYSTORE_PWD + '", "keystore_pw": "' + credentials.ANDROID_KEYSTORE_PWD + '"}}}');

        }, function(err) {
            echo("ERROR", err);
        }).then(function(response, err) {
            echo("Signing key unlocked.");
            echo("Queueing build on Phonegap build.");
            return request.post('https://build.phonegap.com/api/v1/apps/1473540/build' + token)
                .set("Accept", 'application/json')
                .send();

        }, function(err) {
            echo("ERROR", err);
        }).then(function(result) {
            echo("Phonegap build queued!");
        });
}