var api = (function () {
    "use strict"

    var module = {};

    module.fetch = function (callback) {
        let xhr = new XMLHttpRequest();

        xhr.onload = function () {
            if (xhr.status === 200) {
                callback(null, JSON.parse(xhr.responseText));
            } else {
                callback(JSON.parse(xhr.responseText).error, null);
            }
        };

        xhr.open('GET', '/api/publisher', true);
        xhr.send();
    }

    module.queue = function (title, author, address, lyrics, callback) {
        let xhr = new XMLHttpRequest();

        xhr.onload = function () {
            if (xhr.status === 200) {
                callback(null, JSON.parse(xhr.responseText).success);
            } else {
                callback(JSON.parse(xhr.responseText).error, null);
            }
        };

        xhr.open('POST', '/api/publisher/queue', true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify({ title: title, author: author, address: address, lyrics: lyrics }));
    }

    module.log = function (id, callback) {
        let xhr = new XMLHttpRequest();

        xhr.onload = function () {
            if (xhr.status === 200) {
                callback(null, JSON.parse(xhr.responseText).success);
            } else {
                callback(JSON.parse(xhr.responseText).error, null);
            }
        };

        xhr.open('POST', '/api/publisher/log', true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify({ id: id }));
    }

    return module;
})();