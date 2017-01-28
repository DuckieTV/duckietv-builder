require('shelljs/global');

var ZIP_URL = 'https://github.com/SchizoDuckie/DuckieTV/archive/angular.zip';
module.exports = {

    downloadFromZip: function() {
        echo("Downloading: " + ZIP_URL);
        exec("curl -L -O " + ZIP_URL);
        echo("Extracting");
        exec("unzip -q angular.zip");
        mv("DuckieTV-angular/*", ".");
        rm("-rf", "DuckieTV-angular");
        rm("angular.zip");

    }


}