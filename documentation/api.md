# API Documentation

## Quick Access Links

- [Account Management Documentation](#account-management)
- [Song Management Documentation](#song-management)
- [Karaoke Management Documentation](#karaoke-management)
- [WebSockets Documentation](#websockets-management)
- [Database Documentation](#database-documentation)

## Account Management

**Module:** [users.js](../users/users.js)

- [Sign In](#post-signin) - Sign in to an existing account.
- [Sign Up](#post-signup) - Register a new account.
- [Activate Account](#get-activatetoken) - Activates an account using the token provided in the registration email.
- [Forget Password](#post-forgetpassword) - Request to reset your account's password.
- [Reset Password](#post-resettoken) - Validate ownership of your account and reset the password.
- [Sign Out](#get-signout) - Sign out of the website.

### POST /signin/

Sign in to an existing account.

| Parameter | Data Type | Description |
| --- | --- | --- |
| username | String | Username of the account. |
| password | String | Password of the account. |

| Status Code | Description |
| --- | --- |
| 200 | User signed in. |
| 401 | Invalid username or password. |
| 401 | Account's email is not verified. |
| 500 | Internal server error. |

Sample Output:
```
User {$user} signed in.
``` 

### POST /signup/

Register a new account.

| Parameter | Data Type | Description |
| --- | --- | --- |
| username | String | Username of the account to register. |
| password | String | Password of the account to register. |
| email | String | Email of the account to register. |

| Status Code | Description |
| --- | --- |
| 200 | User signed up. |
| 409 | User or email already exists. |
| 500 | Internal server error. |

Sample Output:
```
User {$user} signed up. Check your email.
``` 

### GET /activate/:token/

Activates an account using the token provided in the registration email.

| Parameter | Data Type | Description |
| --- | --- | --- |
| token | String | The authentication used to validate access of the account's registered email. |

| Status Code | Description |
| --- | --- |
| 200 | Activated account. |
| 404 | Email verification token does not exist. |
| 500 | Internal server error. |

Sample Output:
```
Activated {$user}'s account.
``` 

### POST /forgetpassword/

Request to reset your account's password.

| Parameter | Data Type | Description |
| --- | --- | --- |
| email | String | The registered email on the account. |

| Status Code | Description |
| --- | --- |
| 200 | Password reset request has been sent. |
| 401 | User's email has not been verified. |
| 404 | User does not exist. |
| 500 | Internal server error. |

Sample Output:
```
You can reset {$user}'s password. Check your email.
``` 

### POST /reset/:token/

Validate ownership of your account and reset the password.

| Parameter | Data Type | Description |
| --- | --- | --- |
| password | String | The new password of the account. |
| token | String | The authentication used to validate access of the account's registered email. |

| Status Code | Description |
| --- | --- |
| 200 | New password set. |
| 404 | Password reset token does not exist. |
| 500 | Internal server error. |

Sample Output:
```
{$user}'s new password is set.
``` 

### GET /signout/

Sign out of the website.

| Status Code | Description |
| --- | --- |
| 302 | User's active session has been destroyed. |

## Song Management

**Module:** [song-publisher.js](../song-publisher.js)

- [Get All Queued Songs](#get-apipublisher) - Retrieve all the songs requested by a user.
- [Queue a New Song](#post-apipublisherqueue) - Requests a new song to be added to the site.
- [View Logs of a Queued Song](#post-apipublisherlog) - Views the status log of the song render request. Users can only view their own song requests.
- [Get a Song's MP3 File](#get-songuuiduuid) - Retrieves the MP3 of a song, given their unique id.
- [Get All Rendered Songs](#get-apisongs) - Retrieve all the successfully rendered (and playable) songs in the database.

### GET /api/publisher

Retrieve all the songs requested by a user.

| Status Code | Description |
| --- | --- |
| 200 | Returns a list of songs. |
| 403 | User is not signed in. |
| 500 | Internal server error. |

Sample Output:
```
[
	{
		id: ...
		title: ...
		artists: ...
		query_url: ...
		state: ...
	},
	...
]
``` 

### POST /api/publisher/queue

Requests a new song to be added to the site.

| Parameter | Data Type | Description |
| --- | --- | --- |
| title | String | The song's title. |
| author | String | The song's authors or artists. |
| address | String | The song's YouTube address. |
| lyrics | String | The song's lyrics. |

| Status Code | Description |
| --- | --- |
| 200 | New song requested. |
| 400 | Missing parameters. |
| 403 | User is not signed in. |
| 409 | Duplicate song already exists. |
| 500 | Internal server error. |

Sample Output:
```
{
	success: "Successfully queued."
}
``` 

### POST /api/publisher/log

Views the status log of the song render request. Users can only view their own song requests.

| Parameter | Data Type | Description |
| --- | --- | --- |
| id | String | The song's unique identifier. |

| Status Code | Description |
| --- | --- |
| 200 | Status log. |
| 400 | Missing parameters. |
| 403 | User is not signed in. |
| 404 | Song not found. |
| 500 | Internal server error. |

Sample Output:
```
{
	success: "{$log}"
}
``` 

### GET /song/uuid/:uuid

Retrieves the MP3 of a song, given their unique id.

| Parameter | Data Type | Description |
| --- | --- | --- |
| uuid | String | The song's unique identifier. |

| Status Code | Description |
| --- | --- |
| 200 | MP3 file. |
| 400 | Missing parameters. |
| 404 | Song not found. |
| 500 | Internal server error. |

Sample Output:
```
*** {audio/mpeg} ***
``` 

### GET /api/songs

Retrieve all the successfully rendered (and playable) songs in the database.

| Status Code | Description |
| --- | --- |
| 200 | Returns a list of songs. |
| 500 | Internal server error. |

Sample Output:
```
[
	{
		title: ...
		artists: ...
		uuid: ...
		lyrics: ...
	},
	...
]
``` 

## Karaoke Management

**Module:** [solo-mode.js](../solo-mode.js)

- [Validates a Room Code](#get-apisolovalidatecode) - Checks whether or not a given room code has valid syntax.
- [Retrieve the Leader of a Room](#get-apisololeadercode) - Retrieves the leader (host) of a given room. 
- [Create a Room](#get-apisolocreateroom) - Create a new private room.
- [Delete a Room](#delete-apisolodeleteroom) - Deletes an existing room. Only the host can delete the room.

### GET /api/solo/validate/:code

Checks whether or not a given room code has valid syntax.

| Parameter | Data Type | Description |
| --- | --- | --- |
| code | String | The room code. |

| Status Code | Description |
| --- | --- |
| 200 | Valid room code format. |
| 400 | Missing parameters. |
| 400 | Invalid room code format. |

Sample Output:
```
{
	success: "Valid room code format."
}
``` 

### GET /api/solo/leader/:code

Retrieves the leader (host) of a given room. 

| Parameter | Data Type | Description |
| --- | --- | --- |
| code | String | The room code. |

| Status Code | Description |
| --- | --- |
| 200 | Details about the room if you are the leader. |
| 400 | Missing parameters. |
| 400 | Invalid room code format. |
| 403 | Details about the room if you are a spectator. |
| 404 | Room does not exist. |

Sample Output:
```
{
	success: "You are the leader",
	name: "${leader}",
	leader: true
}
``` 

### GET /api/solo/createroom

Create a new private room.

| Status Code | Description |
| --- | --- |
| 200 | Details about the new room. |
| 403 | User is not signed in. |
| 409 | User's room already exists. Details about existing room. |

Sample Output:
```
{
	success: "New room created.",
	room: "${room_code}"
}
``` 

### DELETE /api/solo/deleteroom

Deletes an existing room. Only the host can delete the room.

| Parameter | Data Type | Description |
| --- | --- | --- |
| id | String | The room code to delete. |

| Status Code | Description |
| --- | --- |
| 200 | Room has been deleted. |
| 400 | Missing or invalid parameters. |
| 403 | User is not signed in. |
| 404 | Room not found. |
| 409 | No permissions. |

Sample Output:
```
{
	success: "Room removed."
}
``` 

## WebSockets Management

**Module:** [solo-mode.js](../solo-mode.js)

- [Join a Room](#solo-join-room) - The socket is attempting to join a given room code.
- [Broadcast Audio Header](#solo-header) - The host is sending the header packet to start the audio stream.
- [Broadcast Audio Stream](#solo-stream) - The host is sending a packet to continuously broadcast the audio stream.
- [Broadcast Room State](#solo-state) - The host is updating the game state.
- [Broadcast New Song](#solo-play-song) - The host is playing a new song.
- [Broadcast Song End](#solo-end-song) - The host has stopped playing the current song.
- [Request Room State](#solo-request-state) - The spectator is requesting the state of their current room.

### solo-join-room

The socket is attempting to join a given room code.

| Parameter | Data Type | Description |
| --- | --- | --- |
| id | String | The room code. |

### solo-header

The host is sending the header packet to start the audio stream.

| Parameter | Data Type | Description |
| --- | --- | --- |
| packet | Packet | The header audio packet. |

### solo-stream

The host is sending a packet to continuously broadcast the audio stream.

| Parameter | Data Type | Description |
| --- | --- | --- |
| time | Float | The current time in the host's music track. |
| packet | Packet | The audio packet to broadcast. |

### solo-state

The host is updating the game state.

| Parameter | Data Type | Description |
| --- | --- | --- |
| packet | Packet | The new game state. |

### solo-play-song

The host is playing a new song.

| Parameter | Data Type | Description |
| --- | --- | --- |
| song | Song | A song object, the new song to play. |

### solo-end-song

The host has stopped playing the current song.

### solo-request-state

The spectator is requesting the state of their current room.

## Database Documentation

- [Users](#user-database) - User Database
- [Music](#music-database) - Music Database

### User Database

| Attribute | Value |
| --- | --- |
| Database | NeDB |
| Location | Local Storage |

#### db/users.db

This table is used to store every user's credentials.

| Key | Type | Value |
| --- | --- | --- |
| _id | String | The user's username. |
| email | String | The user's email address. |
| salt | String | A randomized salt for the user's password. |
| hash | String | The user's hashed password. |
| activated | Boolean | A boolean of whether or not the account has been activated. |
| token | String | Email verification or password reset token. |

### Music Database

| Attribute | Value |
| --- | --- |
| Database | MySQL |
| Location | Web Server on Port 3306 |

#### karaoke.songs

This table is used to store every song request made by each user.

| Key | Type | Value |
| --- | --- | --- |
| id | Integer | Unique id of every song request. |
| publisher | String | The user that made this song request. |
| date | Date | The date that this request was made. |
| title | String | The song's title. |
| artists | String | The song's artists. |
| query_url | String | The song's YouTube URL. |
| lyrics | String | The song's lyrics. |
| uuid | String | The song's unique YouTube identifier. |
| log | String | The song's render logs. |
| state | Enum | The state of the song's render process. |
