#!/usr/bin/env node

require('shelljs/global');
var program = require('commander'),
    sharedConfig = require('./shared');

config.verbose = false;
config.fatal = true;


/**
 * cleanup-binaries:
 * - empties the binaries folder
 */
program
    .description('empties the binaries folder')
    .parse(process.argv);

rm('-rf', sharedConfig.BINARY_OUTPUT_DIR);
mkdir(sharedConfig.BINARY_OUTPUT_DIR);
rm('-rf', require('os').homedir() + "/nwjs_download_cache");

echo("Cleanup binaries performed.");
