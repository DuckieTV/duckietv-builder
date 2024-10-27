require('shelljs/global');
var program = require('commander'),
    Promise = require('bluebird'),
    shared = require('./shared'),
    github = require('./github'),
    request = require('superagent'),
    sleep = require('sleep'),
    responseCounter = 0,
    requestCounter = 0,
    haveSceneMappings = [];

config.verbose = false;
config.fatal = true;


/**
 * Update TheXem.info cache
 * Does some preparsing to fetch the list of all the mappings on thexem that have actual mappings.
 */
program
    .description('Update the TheXem.info precached data and publish it to github pages for hosting')
    .option("--publish", "publish to gh-pages")
    .parse(process.argv);


echo("Fetching XROSS Entity Mapping Cache from TheXem.info");

mkdir('-p', shared.XEM_CACHE_DIR);


function fetchMapping(tvdb, idx) {
    // fetch show details. May return 0 results for having both origin tvdb and destination scene!
    echo("waiting for " + ((idx * 2000) / 1000) + " seconds to fetch " + tvdb);
    return new Promise(function(resolve, reject) {
        setTimeout(function() {
            echo("wait over, fetching " + tvdb);
            resolve(request.get('https://thexem.info/map/all?id=' + tvdb + '&origin=tvdb&destination=scene').then(function(response) {
                    var res = response.body,
                        willSave = res.data.length > 0;

                    echo('Fetched ' + tvdb + ". Saving? " + (willSave ? 'yes' : 'no'));
                    responseCounter++;

                    // only cache output when there are mapping results. also put the id in haveSceneMappings.
                    if (willSave) {
                        ShellString(JSON.stringify(res.data, null, 2)).to(shared.XEM_CACHE_DIR + '/' + tvdb + '.json');
                        haveSceneMappings.push(parseInt(tvdb));
                    }
                    return willSave ? parseInt(tvdb) : false;
                }, rqe)

            );
        }, idx * 2000);
    })
}

request.get('https://thexem.info/map/allNames?origin=tvdb')
    .then(function(response) {
        echo("Fetched alias map");
        ShellString(JSON.stringify(response.body.data, null, 2)).to(shared.XEM_CACHE_DIR + '/aliasmap.json');
        return;
    });

request.get('https://thexem.info/map/havemap?origin=tvdb&destination=scene')
    .then(function(response) {
        echo("Fetched ", response.body.data.length + " mapping ids");
        return response.body.data;
    })
    .then(function(mappings) {
        return Promise.all(mappings.map(fetchMapping));
    })
    .then(function(done) {
        // echo("Done performing " + responseCounter + " requests. Publishing results to " + shared.XEM_CACHE_DIR + "/mappings.json");
        ShellString(JSON.stringify(haveSceneMappings.sort( function (a, b) { return a - b } ), null, 2)).to(shared.XEM_CACHE_DIR + '/mappings.json');
    })
    .then(function() {
        if (program.publish) {
            echo("Publishing to github");
            mkdir('-p', shared.XEM_CACHE_DIR + '/repo');
            pushd(shared.XEM_CACHE_DIR + '/repo');
            if (!test('-d', '.git')) {
                exec('git init');
                exec('git remote add origin git@github.com:DuckieTV/xem-cache.git')
                exec('git checkout -b gh-pages');
            }
            exec("git pull origin gh-pages");
            rm('-f', shared.XEM_CACHE_DIR + '/repo/*.json');
            cp(shared.XEM_CACHE_DIR + '/*.json', shared.XEM_CACHE_DIR + '/repo');
            exec("git add .");
            exec('git commit -m "XEM Cache update '+new Date().toISOString()+'"');
            echo("pushing to DuckieTV/xem-cache:gh-pages")
            exec('git push origin gh-pages -f');
            popd();
        } else {
            echo("--publish option missing, not pushing to github.");
        }
        return;
    });

function rqe(e) {
    console.error('Error fetching:', e);
}
