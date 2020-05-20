(function () {
    "use strict"

    window.addEventListener('load', function () {
        document.querySelector('.casual-tab').addEventListener('click', function (e) {
            e.preventDefault();
            api.create(function (err, url) {
                if (err)
                    window.open('/login');
                else
                    window.open('/solo/' + url);
            });
        });

        document.querySelector('.create-tab').addEventListener('click', function (e) {
            e.preventDefault();
            window.open('/publisher', '_blank');
        });
    });
}());