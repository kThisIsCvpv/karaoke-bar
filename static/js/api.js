var api = (function () {
    "use strict"

    var module = {};

    module.create = function (callback) {
        let xhr = new XMLHttpRequest();

        xhr.onload = function () {
            let json = JSON.parse(xhr.responseText);
            if (json.room)
                callback(null, json.room);
            else
                callback(json.error, null);
        };

        xhr.open('GET', '/api/solo/createroom', true);
        xhr.send();
    }

    return module;
})();