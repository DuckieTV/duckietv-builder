require('shelljs/global');

var BUILD_DIR = process.cwd() + '/TMP',
    BUILD_SOURCE_DIR = BUILD_DIR + '/DuckieTV',
    CHANGELOG_DIFF_DIR = BUILD_DIR + '/DuckieTV-angular',
    BASE_OUTPUT_DIR = BUILD_DIR + '/build',
    BINARY_OUTPUT_DIR = process.cwd() + "/binaries",
    NWJS_DOWNLOAD_DIR = require('os').homedir() + "/nwjs_download_cache",
    XEM_CACHE_DIR = BUILD_DIR + "/xem-cache",
    NWJS_VERSION = '0.31.5',
    platforms = ['windows', 'osx', 'linux', 'debian', 'browseraction', 'newtab', 'android'];

module.exports = {
    platforms: platforms,
    NWJS_VERSION: NWJS_VERSION,
    modifyPackageJSON: modifyPackageJSON,
    buildTemplateCache: buildTemplateCache,
    processTabHTML: processTabHTML,
    addNightlyStrings: addNightlyStrings,
    rotateNightlyImages: rotateNightlyImages,
    copyDefaultResources: copyDefaultResources,
    getCredentials: getCredentials,
    putCredentials: putCredentials,
    patchManifest: patchManifest,
    getVersion: getVersion,
    getManifestBackgroundScriptArray:getManifestBackgroundScriptArray,
    buildStandaloneBackgroundJS: buildStandaloneBackgroundJS,
    validateRequestedPlatforms: validateRequestedPlatforms,
    BUILD_DIR: BUILD_DIR,
    BUILD_SOURCE_DIR: BUILD_SOURCE_DIR,
    BASE_OUTPUT_DIR: BASE_OUTPUT_DIR,
    BINARY_OUTPUT_DIR: BINARY_OUTPUT_DIR,
    NWJS_DOWNLOAD_DIR: NWJS_DOWNLOAD_DIR,
    CHANGELOG_DIFF_DIR: CHANGELOG_DIFF_DIR,
    XEM_CACHE_DIR: XEM_CACHE_DIR
};

/**
 * Copy the required additional assets to each build dir
 */
function copyDefaultResources(targets) {
    cd(BUILD_SOURCE_DIR);
    targets.map(function(target) {
        cp('-r', [BASE_OUTPUT_DIR + '/*', 'fanart.cache.json', 'trakt-trending-500.json', '_locales/', 'fonts/', 'img/', 'templates/'], target);
        cp(BUILD_SOURCE_DIR + '/manifest.json', target + '/');
        getManifestBackgroundScriptArray(target +  '/manifest.json').map(function(source) {
            cp(BUILD_SOURCE_DIR + source, target + '/dist');            
        });
        buildStandaloneBackgroundJS(target, getManifestBackgroundScriptArray(target +  '/manifest.json'));
    });
}

function addNightlyStrings(SOURCES_DIR) {
    echo('Nightly mode, patching locales');
    pushd(SOURCES_DIR);
    find("_locales/*/messages.json").map(function(file) {
        var translation = JSON.parse(cat(file));
        translation.appNameNewTab.message += " - Nightly";
        translation.appShortNameNewTab.message += " - Nightly";
        translation.appNameBrowserAction.message += " - Nightly";
        translation.appShortNameBrowserAction.message += " - Nightly";
        ShellString(JSON.stringify(translation, null, "\t")).to(file);
    });
    popd();
}

function rotateNightlyImages(SOURCES_DIR) {
    echo('Rotating nightly logos for webstore');
    pushd(SOURCES_DIR + '/img/logo');
    ['icon16.png', 'icon32.png', 'icon48.png', 'icon128.png', 'icon256.png'].map(function(file) {
        if (process.platform != 'win32') {
            exec("convert " + file + " -rotate 180 " + file);
        } else {
            if (!which('magick')) {
                echo("magick is required to rotate icons. Grab it from http://www.imagemagick.org/script/download.php");
                process.exit();
            }
            exec("magick convert " + file + " -rotate 180 " + file);
        }
    });
    popd();
}


var REPLACE_SCRIPT_MATCH_REGEX = /<!-- deploy:replace\=\'(<script.*)\' -->([\s\S]+?[\n]{0,})[^\/deploy:]<!-- \/deploy:replace -->/gm;

var FIND_SCRIPT_FILENAME_REGEX = /(js\/[a-zA-Z0-9\/\.\-]+)/g;
var REPLACE_CSS_MATCH_REGEX = /<!-- deploy:replace\=\'(<link.*)\' -->([\s\S]+?[\n]{0,})[^\/deploy:]<!-- \/deploy:replace -->/gm;

var FIND_CSS_FILENAME_REGEX = /(css\/[a-zA-Z0-9\/\.\-]+)/g;
var REPLACE_ALL_PLACEHOLDERS_REGEX = /<!-- deploy:replace\=\'(.*)\' -->([\s\S]+?)[^\/deploy:]<!-- \/deploy:replace -->/g;

/**
 * Parse tab.html and find all deploy:replace comments, concat the files between them to their output parameter.
 */
function processTabHTML(nightly) {

    cd(BUILD_SOURCE_DIR);
    var tab = cat('tab.html');

    var matches = tab.match(REPLACE_SCRIPT_MATCH_REGEX); // grab all <deploy:replace script> until </deploy-replace> comments  
    var files = matches.map(function(match) { // iterate all results
        var targetfile = /<!-- deploy:replace='<script src=\"dist\/(.*.js)\"/g.exec(match)[1]; // find out where this has to be concatted to

        echo("processing: dist/" + targetfile);
        var deps = match.match(FIND_SCRIPT_FILENAME_REGEX).map(function(script) { // find all scripts that are referenced in this block
            var mifi = script.replace('.js', '.min.js'); // optionally return the minified version if it exists
            return cat(test('-f', mifi) ? mifi : script); // grab the content of this file and return it
        });
        // join the resulting content by ;\n and write it to the target file
        ShellString(deps.join(";\n")).to(BASE_OUTPUT_DIR + '/dist/' + targetfile);
    });

    matches = tab.match(REPLACE_CSS_MATCH_REGEX); // then find <the deploy:replace css>

    // and iterate, read, concat and save.
    matches.map(function(match) {
        var targetfile = /href="dist\/(.*\.css)\"/g.exec(match)[1];
        echo("processing: dist/" + targetfile);
        var styles = match.match(FIND_CSS_FILENAME_REGEX);
        if (!nightly) {
            styles.push('css/hide-prod.css');
        }
        cat(styles).to(BASE_OUTPUT_DIR + "/dist/" + targetfile);

    });

    // remove the whole deploy:replace block and replace it with an include to the target file
    tab = tab.replace(REPLACE_ALL_PLACEHOLDERS_REGEX, '$1')
        .replace('</body>', '<script src="dist/templates.js"></script></body>');

    // write the modified content to tab.html
    ShellString(tab).to(BASE_OUTPUT_DIR + '/tab.html');
}

/**
 * Find all finds all html files in the templates dir and concat them into a templatecache file in dist/template.html
 */
function buildTemplateCache(input) {
    var templatecacheRender = require('ng-templatecache');

    var cache = {
        entries: [],
        module: 'DuckieTV'
    };

    cd(BUILD_SOURCE_DIR);
    find(['templates/*.html', 'templates/**/*.html']).map(function(file) {
        cache.entries.push({
            content: cat(file),
            path: file
        });
    });

    cd(BASE_OUTPUT_DIR);
    ShellString(templatecacheRender(cache)).to('dist/templates.js');
}

function getVersion() {
    return cat(BASE_OUTPUT_DIR + '/VERSION');
}

function modifyPackageJSON(options, BUILD_DIR) {
    var json = JSON.parse(cat(BUILD_SOURCE_DIR + '/package.json'));
    json.version = getVersion();
    json.window.title = json.name + ((options.nightly) ? ' Nightly' : '') + " v" + getVersion();
    json['user-agent'] = "%name " + ((options.nightly) ? ' Nightly' : '') + " v%ver %osinfo";
    ShellString(JSON.stringify(json, null, "\t")).to(BUILD_DIR + '/package.json');
}

function getCredentials() {
    var homedir = '/home/' + exec('whoami').trim();
    if (require('fs').existsSync(homedir + '/.duckietv-builder.json')) {
        return JSON.parse(cat(homedir + "/.duckietv-builder.json"));
    } else {
        throw new Error("No " + homedir + "/.duckietv-builder.json available. Use the template in ./duckietv-builder.json-template");
    }
}

function putCredentials(credentials) {
    var homedir = '/home/' + exec('whoami').trim();
    if (require('fs').existsSync(homedir + '/.duckietv-builder.json')) {
        ShellString(JSON.stringify(credentials, null, "\t")).to(homedir + "/.duckietv-builder.json");
    } else {
        throw new Error("No " + homedir + "/.duckietv-builder.json available. Use the template in ./duckietv-builder.json-template");
    }
}

function patchManifest(BUILD_DIR, backgroundScripts) {
    var manifest = JSON.parse(cat(BUILD_DIR + '/manifest.json'));
    manifest.version = cat(BUILD_DIR + "/VERSION");
    manifest.background.scripts = backgroundScripts;
    ShellString(JSON.stringify(manifest, null, "\t")).to(BUILD_DIR + "/manifest.json");
}

/**
 * concatenate the contents of files from the manifest.background.scripts array into the standalone-background.js file
 */
function buildStandaloneBackgroundJS(BUILD_DIR, manifestBSArray) {
    echo("processing: standalone-background.js");
    var source = manifestBSArray.map(function(script) {
        return cat(BUILD_SOURCE_DIR + script);
    });
    ShellString(source.join(";\n")).to(BUILD_DIR + '/standalone-background.js');
}

/**
 * returns the manifest.json background.script array, optionally modified with prefix 
 */
function getManifestBackgroundScriptArray(manifestPath, optionalPrefix) {
    var manifest = JSON.parse(cat(manifestPath));
    var manifestBSArray = manifest.background.scripts.map(function(item) {
        return '/' + item;
    })
    if (optionalPrefix) {
        manifestBSArray = manifestBSArray.map(function(item) {
            var path = item.split("/");
            return optionalPrefix + path[path.length - 1];
        })
    }
    return manifestBSArray;
}

/**
 * validate requested platforms and terminate on invalids 
 */
function validateRequestedPlatforms(platformsRequested) {
    platformsRequested.map(function(platform) {
        if (platforms.indexOf(platform) === -1) {
            echo(platform + ' is not a valid platform. Use one or more of ' + platforms);         
            process.exit();
        }
    });
}