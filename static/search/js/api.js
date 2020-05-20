var api = (function () {
    "use strict"

    var module = {};

    module.fetch = function (callback) {
        let xhr = new XMLHttpRequest();

        xhr.onload = function () {
            if (xhr.status === 200) {
                callback(null, JSON.parse(xhr.responseText).success);
            } else {
                callback(JSON.parse(xhr.responseText).error, null);
            }
        };

        xhr.open('GET', '/api/songs', true);
        xhr.send();
    }

    return module;
})();