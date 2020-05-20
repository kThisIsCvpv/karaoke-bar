(function () {
    "use strict"

    function removeLoadingLogo() {
        if (document.querySelector('.loading-header'))
            document.querySelector('.loading-header').remove();
    }

    function addDefaultLogo(parent) {
        let element = document.createElement('div');
        element.classList.add('logo-header');

        let image = document.createElement('img');
        image.setAttribute('src', '/assets/logo.png');
        element.appendChild(image);

        parent.appendChild(element);
    }

    function generateTableHeader(name) {
        let header = document.createElement('th');
        header.innerText = name;
        return header;
    }

    function clickRequest() {
        let body = document.querySelector('.body-style');

        if (document.querySelector('.publisher-background') || !body)
            return;

        let publisher = document.createElement('div');
        publisher.classList.add('publisher-background');
        publisher.innerHTML = '<div class="publisher-divider"> <form id="publisher-form"> <label for="songTitle">Song Title</label> <input type="text" id="songTitle" name="songTitle" autocomplete="off" placeholder="Insert Song Title" required/> <label for="songAuthor">Song Author</label> <input type="text" id="songAuthor" name="songAuthor" autocomplete="off" placeholder="Insert Song Artist(s)" required/> <label for="songAddress">Song Address</label> <input type="text" id="songAddress" name="songAddress" autocomplete="off" placeholder="Insert YouTube URL" required/> <label for="songLyrics">Song Lyrics</label> <textarea rows="4" cols="50" id="songLyrics" name="songLyrics" autocomplete="off" placeholder="Insert Song Lyrics"></textarea> <div class="form-controls"> <button id="publisher-close" class="cancel-button" type="button">Close</button> <button class="submit-button" type="submit">Submit</button> </div></form> </div>';

        publisher.addEventListener('click', function (e) {
            if (this === e.target) {
                e.preventDefault();
                if (document.querySelector('.publisher-background'))
                    document.querySelector('.publisher-background').remove();
            }
        });

        publisher.querySelector('#publisher-close').addEventListener('click', function (e) {
            e.preventDefault();
            if (document.querySelector('.publisher-background'))
                document.querySelector('.publisher-background').remove();
        });

        publisher.querySelector('#publisher-form').addEventListener('submit', function (e) {
            e.preventDefault();

            let title = publisher.querySelector('#songTitle').value;
            let artists = publisher.querySelector('#songAuthor').value;
            let address = publisher.querySelector('#songAddress').value;
            let lyrics = publisher.querySelector('#songLyrics').value;

            api.queue(title, artists, address, lyrics, function (err, success) {
                if (err) {
                    swal('Queue Failed', 'An error occured while adding to the queue.\nTrace: ' + err, 'error');
                } else {
                    if (document.querySelector('.publisher-background'))
                        document.querySelector('.publisher-background').remove();
                    swal('Queue Success', 'You have successfully added a new song to the queue!', 'success');
                }
            });
        });

        body.appendChild(publisher);
    }

    let lastLogRender = null;
    let logInteval = null;

    function cycleRenderLog(id) {
        api.log(id, function (err, content) {
            if (err) {
                if (logInteval != null) {
                    clearInterval(logInteval);
                    logInteval = null;
                }
            } else {
                if (lastLogRender != null && lastLogRender === content)
                    return;

                lastLogRender = content;

                let code = document.querySelector('pre');
                if (code == null) {
                    if (logInteval != null) {
                        clearInterval(logInteval);
                        logInteval = null;
                    }

                    return;
                }

                code.innerText = content;
            }
        });
    }

    function clickLog(name, id) {
        api.log(id, function (err, content) {
            if (err) {
                swal('Queue Failed', 'An error occured while fetching the logs.\nTrace: ' + err, 'error');
            } else {
                if (logInteval != null) {
                    clearInterval(logInteval);
                    logInteval = null;
                }

                let body = document.querySelector('.body-style');

                if (document.querySelector('.log-background') || !body)
                    return;

                let logs = document.createElement('div');
                logs.classList.add('log-background');
                logs.innerHTML = '<div class="log-divider"> <div class="log-header"> <div class="log-title"> <h1>Song Title</h1> </div><div class="log-close"> <a href="#"> <img src="https://cdn.pixabay.com/photo/2012/04/12/20/12/x-30465_960_720.png"></img> </a> </div></div><pre></pre> </div>';

                logs.querySelector('h1').innerText = name;
                logs.querySelector('pre').innerText = content;
                lastLogRender = content;

                logs.addEventListener('click', function (e) {
                    if (this === e.target) {
                        e.preventDefault();

                        if (document.querySelector('.log-background'))
                            document.querySelector('.log-background').remove();

                        lastLogRender = null;
                        if (logInteval != null) {
                            clearInterval(logInteval);
                            logInteval = null;
                        }
                    }
                });

                logs.querySelector('a').addEventListener('click', function (e) {
                    e.preventDefault();

                    if (document.querySelector('.log-background'))
                        document.querySelector('.log-background').remove();

                    lastLogRender = null;
                    if (logInteval != null) {
                        clearInterval(logInteval);
                        logInteval = null;
                    }
                });

                body.appendChild(logs);

                logInteval = setInterval(function () {
                    cycleRenderLog(id);
                }, 1000);
            }
        });
    }

    function renderLogs(button, name, id) {
        button.addEventListener('click', function () {
            clickLog(name, id);
        });
    }

    let lastTableRender = null;

    function cycleRenderTable() {
        api.fetch(function (err, songs) {
            if (err) {
                console.log('An error has occured while fetching songs: ' + err);
                location.reload();
                return;
            }

            let newRender = JSON.stringify(songs);

            if (newRender === lastTableRender)
                return;

            lastTableRender = newRender;

            let userTbody = document.createElement('tbody');

            // The Table Header

            let headerRegion = document.createElement('tr');
            headerRegion.classList.add('table-header');

            headerRegion.appendChild(generateTableHeader('Song Title'));
            headerRegion.appendChild(generateTableHeader('Song Author'));
            headerRegion.appendChild(generateTableHeader('Song Source'));
            headerRegion.appendChild(generateTableHeader('Status'));
            headerRegion.appendChild(generateTableHeader('Result'));

            userTbody.appendChild(headerRegion);

            // The Table Body

            if (songs.length == 0) {
                let invalidRegion = document.createElement('tr');
                invalidRegion.classList.add('invalid-row');
                invalidRegion.innerHTML = '<td colspan="5">You haven\'t published any songs! Why not add something new?</td>';
                userTbody.appendChild(invalidRegion);
            } else {
                for (let i = 0; i < songs.length; i++) {
                    let song = songs[i];

                    let validRegion = document.createElement('tr');
                    validRegion.classList.add(i % 2 == 0 ? 'mod-0' : 'mod-1');

                    let titleDisplay = document.createElement('td');
                    titleDisplay.innerText = song.title;
                    validRegion.appendChild(titleDisplay);

                    let artistsDisplay = document.createElement('td');
                    artistsDisplay.innerText = song.artists;
                    validRegion.appendChild(artistsDisplay);

                    let sourceDisplay = document.createElement('td');
                    sourceDisplay.innerHTML = '<a target="_blank"> <img src="assets/youtube-logo.webp"/> </a>';
                    sourceDisplay.querySelector('a').setAttribute('href', song.query_url);
                    validRegion.appendChild(sourceDisplay);

                    let buttonDisplay = document.createElement('td');
                    buttonDisplay.innerHTML = '<button type="button">View Logs</button>';
                    renderLogs(buttonDisplay.querySelector('button'), song.title, song.id);
                    validRegion.appendChild(buttonDisplay);

                    let statusDisplay = document.createElement('td');
                    statusDisplay.innerText = song.state.charAt(0).toUpperCase() + song.state.substring(1);
                    validRegion.appendChild(statusDisplay);

                    userTbody.appendChild(validRegion);
                }
            }

            document.querySelector('tbody').remove();
            document.querySelector('.user-table').appendChild(userTbody);
        });
    }

    function renderTable(parent, songs) {
        lastTableRender = JSON.stringify(songs);

        let tableDivider = document.createElement('div');
        tableDivider.classList.add('table-divider');

        let requestButton = document.createElement('button');
        requestButton.setAttribute('type', 'button');
        requestButton.id = 'insert-button';
        requestButton.innerText = 'Request New Song';
        requestButton.addEventListener('click', clickRequest);
        tableDivider.appendChild(requestButton);

        let userTable = document.createElement('table');
        userTable.classList.add('user-table');

        let userTbody = document.createElement('tbody');

        // The Table Header

        let headerRegion = document.createElement('tr');
        headerRegion.classList.add('table-header');

        headerRegion.appendChild(generateTableHeader('Song Title'));
        headerRegion.appendChild(generateTableHeader('Song Author'));
        headerRegion.appendChild(generateTableHeader('Song Source'));
        headerRegion.appendChild(generateTableHeader('Status'));
        headerRegion.appendChild(generateTableHeader('Result'));

        userTbody.appendChild(headerRegion);

        // The Table Body

        if (songs.length == 0) {
            let invalidRegion = document.createElement('tr');
            invalidRegion.classList.add('invalid-row');
            invalidRegion.innerHTML = '<td colspan="5">You haven\'t published any songs! Why not add something new?</td>';
            userTbody.appendChild(invalidRegion);
        } else {
            for (let i = 0; i < songs.length; i++) {
                let song = songs[i];

                let validRegion = document.createElement('tr');
                validRegion.classList.add(i % 2 == 0 ? 'mod-0' : 'mod-1');

                let titleDisplay = document.createElement('td');
                titleDisplay.innerText = song.title;
                validRegion.appendChild(titleDisplay);

                let artistsDisplay = document.createElement('td');
                artistsDisplay.innerText = song.artists;
                validRegion.appendChild(artistsDisplay);

                let sourceDisplay = document.createElement('td');
                sourceDisplay.innerHTML = '<a target="_blank"> <img src="assets/youtube-logo.webp"/> </a>';
                sourceDisplay.querySelector('a').setAttribute('href', song.query_url);
                validRegion.appendChild(sourceDisplay);

                let buttonDisplay = document.createElement('td');
                buttonDisplay.innerHTML = '<button type="button">View Logs</button>';
                renderLogs(buttonDisplay.querySelector('button'), song.title, song.id);
                validRegion.appendChild(buttonDisplay);

                let statusDisplay = document.createElement('td');
                statusDisplay.innerText = song.state.charAt(0).toUpperCase() + song.state.substring(1);
                validRegion.appendChild(statusDisplay);

                userTbody.appendChild(validRegion);
            }
        }

        userTable.appendChild(userTbody);
        tableDivider.appendChild(userTable);

        parent.appendChild(tableDivider);

        setInterval(cycleRenderTable, 2000);
    }

    window.addEventListener('load', function () {
        api.fetch(function (err, songs) {
            if (err) {
                console.log('An error has occured while fetching songs: ' + err);
                location.reload();
                return;
            }

            removeLoadingLogo();

            let bodyElement = document.querySelector('.body-style');

            if (!bodyElement) {
                console.log('Unable to find body element.');
                return;
            }

            addDefaultLogo(bodyElement);

            renderTable(bodyElement, songs);
        });
    });
})();