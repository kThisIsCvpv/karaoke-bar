# Karaoke

## Team Members

| Team Member | Email Address |
| --- | --- |
| Charles Xu | charles.xu@mail.utoronto.ca |
| Eugene Wong | eeugene.wong@mail.utoronto.ca |

## Project Description

We all know what karaoke is. Sing and enjoy a song to your favourite tune. And maybe even at one point in our lives, we all wanted to try it out for ourselves. However, this is where we run into problems.

Back in 2015, a popular online karaoke platform [KaraokeParty](https://www.karaokeparty.com/) was [discontinued](https://www.reddit.com/r/KaraokeParty/comments/3m2flh/karaoke_party_dead_for_how_many_countries/). At the time, KaraokeParty was everyone's go to location for karaoke on the internet. The platform was competitive and simulated an experience similar to that of your local karaoke bar. Here is a video for reference: [YouTube](https://www.youtube.com/watch?v=BVy5mX3gaDM)

Since then, there has not been a similar recreation (at least not that I know of).

There are other platforms where you could test out your voice. Such an example is [Twitch Sings](https://www.twitch.tv/sings/en-gb/download). However, the majority of these platforms introduce unfavourable limits or conditions that hinder a pleasant user experience. For instance, you could only play by yourself (no live audience feedback). Or your favourite song might not even be available...

The goal of this project is to create a competitive experience similar to the old KaraokeParty, allow users to conduct live involvement with the audience, while also letting users select their own favourite songs.

## Beta Version (Due: Sunday March 15th 2020)

- [ ] Allow users to sign up or log in using different user accounts.

- [ ] Create a splash page that redirects users to different areas of the site.

- [ ] Allow users to add their own songs to the database via a YouTube link.
- [ ] Allowing users to index all available songs others have rendered.

- [ ] Create a template of how an abstract session is displayed to the user.
- [ ] Work on single-user mode: 1 user is scored on a single song with no audience.

## Final Version (Due: Sunday March 29th 2020)

- [ ] Work on multi-user mode. 1 user is scored while other listen. Or several users are scored at the same time.
- [ ] Create a high scores (leaderboard) system for each individual song.

- [ ] Fix any bugs, should they exist.
- [ ] Touch up and polishing. Create some nice logos. Make sure the site has a favicon. Etc.

## Technology Involvement

**Disclaimer:** This is just a rough list. Technology may be added (or removed) from the list if they are necessary (or no longer necessary) as the project develops.

### Frontend Resources
- [x] [Youtube Player](https://developers.google.com/youtube/iframe_api_reference) - YouTube iFrame embedder and video player.
- [x] [p5.js](https://p5js.org/) - Retrieving audio input from the user.
- [x] [d3.js](https://d3js.org/) - Rendering a canvas in the browser.
- [x] [Pusher](https://pusher.com/tutorials/webrtc-video-call-app-nodejs) - WebRTC technology to deliver content from one user to the other.

### Backend Software
- [x] [Node.js](https://nodejs.org/en/) - Main framework used to program the backend.
- [x] [MySQL](https://www.mysql.com/) - Relational database used to store user information.
- [x] [Ubuntu 19.10](http://releases.ubuntu.com/19.10/) - Operating system used to run the backend.

### Node.js Extensions
- [x] [Express](https://expressjs.com/) - Web framework for Node.js to handle our REST communication and deliver page content.
- [x] [Child Process](https://nodejs.org/api/child_process.html) - Used to execute commands on the operating system.

### Command Line Applications
- [x] [youtube-dl](https://ytdl-org.github.io/youtube-dl/index.html) - Download YouTube videos via the command line.
- [x] [FFmpeg](https://www.ffmpeg.org/) - Convert video files to audio files.
- [x] [Sound eXchange](http://sox.sourceforge.net/) - Artifically attempts to remove the vocal track from an audio file.

## Technical Challenges

### Audio Synchronization

Music is played in the leader's browser, then sent to the server, along with their voice. We must make sure that the music is timely synced with the voice.
We must be able to maintain this sync, even after the leader pauses (then resumes) the session.

```
[Music & Singer] -> [Server] -> [Audience]
```

Input lag is independent from user to user. The challenge here is to accomodate for this lag for all users in the session while maintaining a fair score system. 

### Latency Synconization

In group mode, users could be anywhere in the world. Thus, everybody will have different latency delays in correlation to the server.
Users might not start the same song at the same time. Users also might not end the song at the same time.

The challenge is to be able to accomondate for different communication latency. How do we know when to terminate a session? What happens during the time someone is waiting for someone else to finish? 

### Network Errors

There are a lot of challenges that we must be able to account for here. 

What happens if the audio starts to buffer?
What happens if the user's connection (output) cannot send enough data to keep up with the audio?
What happens if the user disconnects? Do we kick them out of the game?

### Understanding Audio

We must understand how to retroactively concatenate music from the browser with the audio we recieve from the user's microphone.

There doesn't seem to be any libraries that allows us to do this on the client side. 

The challenge is that we may have to do this manually, requiring us to have some understanding of FFT. Then using this edited audio, we must be able to send it to others to be played elsewhere.

### Integrity of the Scoring System

We must maintain the integrity of the scoring system. This means that scoring must happen on the server side.

The challenge here is figuring out what type of data to send. Do we send the state of the user's voice in relation to the current music's time? How does the backend decode and process the information sent?

### Responsive Feedback during Processing

To tackle the problem of allowing users to use their own songs, we must first download the song ourselves, then process it.

The problem is, this download may take a long time, depending on the queue size and the length of the song.

We need to be able to provide feedback to the user, essentially updating them on the process. 

This may be difficult to do as command line applications are directed to STDOUT and not to any specific location or variable.



