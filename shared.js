require('shelljs/global');

var BUILD_DIR = process.cwd() + '/TMP';
var BUILD_SOURCE_DIR = BUILD_DIR + '/DuckieTV';
var BASE_OUTPUT_DIR = BUILD_DIR + '/build';
var BINARY_OUTPUT_DIR = process.cwd() + "/binaries";

module.exports = {
    platforms: ['windows', 'osx', 'linux', 'deb', 'browseraction', 'newtab', 'cordova'],
    modifyPackageJSON: modifyPackageJSON,
    buildTemplateCache: buildTemplateCache,
    copyFilesToBase: copyFilesToBase,
    processTabHTML: processTabHTML,
    addNightlyStrings: addNightlyStrings,
    copyDefaultResources: copyDefaultResources,
    getCredentials: getCredentials,
    patchManifest: patchManifest,
    getVersion: getVersion,
    BUILD_DIR: BUILD_DIR,
    BUILD_SOURCE_DIR: BUILD_SOURCE_DIR,
    BASE_OUTPUT_DIR: BASE_OUTPUT_DIR,
    BINARY_OUTPUT_DIR: BINARY_OUTPUT_DIR,
    NWJS_VERSION: '0.19.5'
};

/**
 * Copy the required additional assets to each build dir
 */
function copyDefaultResources(targets) {
    cd(BUILD_SOURCE_DIR);
    targets.map(function(target) {
        cp('-r', [BASE_OUTPUT_DIR + '/*', 'fanart.cache.json', 'trakt-trending-500.json', '_locales/', 'fonts/', 'img/', 'templates/'], target);
        cp(BUILD_SOURCE_DIR + '/js/background.js', target + '/dist');
        cp(BUILD_SOURCE_DIR + '/manifest.json', target + '/');
    });
}

function addNightlyStrings(targets) {
    echo('Nightly mode, patching locales');
    cd(BUILD_SOURCE_DIR);
    find("_locales/*/messages.json").map(function(file) {
        var translation = JSON.parse(cat(file));
        translation.appNameNewTab.message += " - Nightly";
        translation.appShortNameNewTab.message += " - Nightly";
        translation.appNameBrowserAction.message += " - Nightly";
        translation.appShortNameBrowserAction.message += " - Nightly";
        ShellString(JSON.stringify(translation, null, "\t")).to(file);
    });
}


var REPLACE_SCRIPT_MATCH_REGEX = /<!-- deploy:replace\=\'(<script.*)\' -->([\s\S]+?[\n]{0,})[^\/deploy:]<!-- \/deploy:replace -->/gm;

var FIND_SCRIPT_FILENAME_REGEX = /(js\/[a-zA-Z0-9\/\.\-]+)/g;
var REPLACE_CSS_MATCH_REGEX = /<!-- deploy:replace\=\'(<link.*)\' -->([\s\S]+?[\n]{0,})[^\/deploy:]<!-- \/deploy:replace -->/gm;

var FIND_CSS_FILENAME_REGEX = /(css\/[a-zA-Z0-9\/\.\-]+)/g;
var REPLACE_ALL_PLACEHOLDERS_REGEX = /<!-- deploy:replace\=\'(.*)\' -->([\s\S]+?)[^\/deploy:]<!-- \/deploy:replace -->/g;

/**
 * Parse tab.html and find all deploy:replace comments, concat the files between them to their output parameter.
 */
function processTabHTML() {

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
        cat(styles).to(BASE_OUTPUT_DIR + "/dist/" + targetfile);
    });

    // remove the whole deploy:replace block and replace it with an include to the target file
    tab = tab.replace(REPLACE_ALL_PLACEHOLDERS_REGEX, '$1')
        .replace('</body>', '<script src="dist/templates.js"></script></body>');

    // write the modified content to tab.html
    ShellString(tab).to(BASE_OUTPUT_DIR + '/tab.html');
}

/**
 * Copy all files from existing duckietv dir for now
 */
function copyFilesToBase() {
    cp('-r', '/var/www/DuckieTV/*', BUILD_SOURCE_DIR);
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
    var title = "DuckieTV Standalone" + ((options.nightly) ? ' Nightly' : '') + " v" + getVersion();
    json.version = getVersion();
    json['user-agent'] = json.window.title = title;
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

function patchManifest(BUILD_DIR, backgroundScripts) {
    var manifest = JSON.parse(cat(BUILD_DIR + '/manifest.json'));
    manifest.version = getVersion();
    manifest.background.scripts = backgroundScripts;
    ShellString(JSON.stringify(manifest, null, "\t")).to(BUILD_DIR + "/manifest.json");
}