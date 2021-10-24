/**
 * This is Track.ts
 *
 * Track.ts is the model structure of a track that can be played by KanyeBot. On startup,
 * KanyeBot will initialise an array of tracks from the contents of the tracks.json file in
 * the tracks folder, therefore the structure of Track.ts will match the structure of each
 * entry in the tracks.json file.
 *
 * Title, AlbumName and YearOfRelease are all broadcast through the bot when the current
 * playing track changes. They are shown in the bot console / log, in the rich presence
 * status of KanyeBot (Playing <SONG>) and is broadcast as a chat message in all subscribed
 * text channels.
 */

export interface Track
{
	/**
	 * Title is the name of the track.
	 */
	title: string;

	/**
	 * AlbumName is the name of the album that the track is a part of (if applicable)
	 */
	albumName: string;

	/**
	 * YearOfRelease is the year that the track (or album) was released
	 */
	yearOfRelease: string;

	/**
	 * FilePath is the path (relative to the tracks folder) where the audio source of the
	 * track is located
	 */
	filePath: string;
}
