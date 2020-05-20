package com.kthisiscvpv.karaoke;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.URL;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Duration;

import org.json.JSONArray;
import org.json.JSONObject;

public class App {

	// https://www.youtube.com/watch?v=fzQ6gRAEoy0
	// https://youtu.be/fzQ6gRAEoy0?t=1

	public static String fetchVideoId(String url) {
		if (url == null)
			return null;

		try {
			if (url.contains("youtu.be/")) {
				int start = url.indexOf("youtu.be/") + 9;
				url = url.substring(start, start + 11);
			} else if (url.contains("youtube.com/") && url.contains("v=")) {
				int start = url.indexOf("v=") + 2;
				url = url.substring(start, start + 11);
			}
		} catch (Exception e) {
			return null;
		}

		return url.length() == 11 ? url : null;
	}

	public static JSONObject fetchVideoDetails(String id) {
		try {
			URL url = new URL("https://www.googleapis.com/youtube/v3/videos?part=contentDetails,statistics&key=INSERT_KEY_HERE&id=" + id);

			BufferedReader in = new BufferedReader(new InputStreamReader(url.openStream()));

			StringBuilder sb = new StringBuilder();

			String inputLine;
			while ((inputLine = in.readLine()) != null)
				sb.append(inputLine);

			in.close();

			JSONObject obj = new JSONObject(sb.toString());
			return obj;
		} catch (Exception ex) {
			ex.printStackTrace();
			return null;
		}
	}

	public static int appendLogs(Connection conn, int id, String log) throws SQLException {
		PreparedStatement ps = conn.prepareStatement("UPDATE songs SET log = ifnull(concat(log, ?), ?) WHERE id = ?;");

		ps.setString(1, log);
		ps.setString(2, log);
		ps.setInt(3, id);

		return ps.executeUpdate();
	}

	public static int updateState(Connection conn, int id, String state) throws SQLException {
		PreparedStatement ps = conn.prepareStatement("UPDATE songs SET state = ? WHERE id = ?;");

		ps.setString(1, state);
		ps.setInt(2, id);

		return ps.executeUpdate();
	}

	public static void main(String[] args) throws InterruptedException {

		// System.out.println(fetchVideoId("https://www.youtube.com/watch?v=fzQ6gRAEoy0"));
		// System.out.println(fetchVideoId("https://youtu.be/fzQ6gRAEoy0?t=1"));
		//
		// System.out.println(fetchVideoDetails(fetchVideoId("https://youtu.be/fzQ6gRAEoy0?t=1")).toString(4));

		while (true) {
			try {
				Connection conn = null;

				try {
					conn = DriverManager.getConnection("jdbc:mysql://karaokebar.live:3306/karaoke?serverTimezone=EST", "INSERT_SQL_USERNAME", "INSERT_SQL_PASSWORD");

					while (true) {
						PreparedStatement ps = conn.prepareStatement("SELECT * FROM songs WHERE state=? OR state=? ORDER BY date ASC;");
						ps.setString(1, "waiting");
						ps.setString(2, "processing");

						ResultSet rs = ps.executeQuery();

						while (rs.next()) {
							long startTime = System.currentTimeMillis();
							int id = rs.getInt("id");

							try {
								// Start the process the video.
								updateState(conn, id, "processing");

								// Parse the video's identifier.
								String queryUrl = rs.getString("query_url");
								String videoId = fetchVideoId(queryUrl);

								if (videoId == null) {
									PreparedStatement psb = conn.prepareStatement("UPDATE songs SET log = ?, uuid = ?, state = ? WHERE id = ?;");
									
									psb.setString(1, "\n---- Result ----\nInvalid video address: " + queryUrl + "\n");
									psb.setString(2, "https://www.youtube.com/");
									psb.setString(3, "failed");
									psb.setInt(4, id);
									psb.executeUpdate();

									psb.close();
									
									System.out.printf("[%d] Unable to parse video id: %s\n", id, queryUrl);
									continue;
								}

								// Search for the video on YouTube.
								JSONObject videoDetails = fetchVideoDetails(videoId);

								if (videoDetails == null) {
									PreparedStatement psb = conn.prepareStatement("UPDATE songs SET log = ?, uuid = ?, state = ? WHERE id = ?;");
									
									psb.setString(1, "\n---- Result ----\nUnable to fetch video details from server.\n");
									psb.setString(2, "https://youtu.be/" + videoId);
									psb.setString(3, "failed");
									psb.setInt(4, id);
									psb.executeUpdate();

									psb.close();
									
									System.out.printf("[%d] Unable to fetch video details.\n", id);
									continue;
								}

								System.out.println(videoDetails.toString(4));
								appendLogs(conn, id, videoDetails.toString(4) + "\n");

								// Fetch the attributes of the video.
								JSONArray itemsArr = videoDetails.getJSONArray("items");

								if (itemsArr.length() != 1) {
									PreparedStatement psb = conn.prepareStatement("UPDATE songs SET log = concat(log, ?), uuid = ?, state = ? WHERE id = ?;");
									
									psb.setString(1, "\n---- Result ----\nUnable to find video on the server.\n");
									psb.setString(2, "https://youtu.be/" + videoId);
									psb.setString(3, "failed");
									psb.setInt(4, id);
									psb.executeUpdate();

									psb.close();
									
									System.out.printf("[%d] Unable to find video details.\n", id);
									continue;
								}

								// Check that we haven't rendered the video already.
								File outputFile = new File(videoId + ".mp3");

								if (outputFile.exists()) {
									PreparedStatement psb = conn.prepareStatement("UPDATE songs SET log = concat(log, ?), uuid = ?, state = ? WHERE id = ?;");
									
									psb.setString(1, "\n---- Result ----\nVideo has already been rendered previously.\n");
									psb.setString(2, "https://youtu.be/" + videoId);
									psb.setString(3, "aborted");
									psb.setInt(4, id);
									psb.executeUpdate();

									psb.close();
									
									System.out.printf("[%d] Duplicate video being rendered.\n", id);
									continue;
								}

								// Check that the video is less than 10 minutes long.
								JSONObject itemObj = itemsArr.getJSONObject(0);
								String ptDuration = itemObj.getJSONObject("contentDetails").getString("duration");

								Duration duration = Duration.parse(ptDuration);
								long seconds = duration.getSeconds();

								if (seconds > 600) {
									PreparedStatement psb = conn.prepareStatement("UPDATE songs SET log = concat(log, ?), uuid = ?, state = ? WHERE id = ?;");
									psb.setString(1, "\n---- Result ----\nVideo is too long! Maximum length is 10 minutes.\nYour video is " + duration.toString() + " long.\n");
									psb.setString(2, "https://youtu.be/" + videoId);
									psb.setString(3, "failed");
									psb.setInt(4, id);
									psb.executeUpdate();

									psb.close();
									
									System.out.printf("[%d] Video is too long! %d seconds...\n", id, seconds);
									continue;
								}

								// Start downloading the video.
								appendLogs(conn, id, "\n---- Downloading Video ----\n");

								ProcessBuilder pb = new ProcessBuilder("youtube-dl", "--extract-audio", "--audio-format", "mp3", "https://youtu.be/" + videoId);
								pb.redirectErrorStream(true);

								Process process = pb.start();

								InputStream is = process.getInputStream();
								InputStreamReader isr = new InputStreamReader(is);
								BufferedReader br = new BufferedReader(isr);

								String outputFileName = null;

								String ln;
								while ((ln = br.readLine()) != null) {
									if (!ln.isEmpty()) {

										appendLogs(conn, id, ln + "\n");
										System.out.println(ln);

										if (ln.contains("Destination: ")) {
											String name = ln.split("Destination: ")[1];
											if (name.endsWith(".mp3"))
												outputFileName = name;
										}
									}
								}

								br.close();
								isr.close();
								is.close();

								if (outputFileName == null) { // The download failed.
									PreparedStatement psb = conn.prepareStatement("UPDATE songs SET log = concat(log, ?), uuid = ?, state = ? WHERE id = ?;");
									psb.setString(1, "\n---- Result ----\nVideo download failed! Please try again later.\n");
									psb.setString(2, "https://youtu.be/" + videoId);
									psb.setString(3, "failed");
									psb.setInt(4, id);
									psb.executeUpdate();

									psb.close();
									
									System.out.printf("[%d] Video download failed...\n", id);
									continue;
								}

								// The download was successful.
								appendLogs(conn, id, "\nDownload successful!\nOutput File: " + outputFileName + "\n");
								new File(outputFileName).renameTo(outputFile);

								// Start downloading the video.
								appendLogs(conn, id, "\n---- Vocalizing Audio ----\n");

								// Remove the vocals from the video.
								pb = new ProcessBuilder("sox", outputFile.getAbsolutePath(), videoId + "-no-audio.mp3", "oops");
								pb.redirectErrorStream(true);

								process = pb.start();

								is = process.getInputStream();
								isr = new InputStreamReader(is);
								br = new BufferedReader(isr);

								while ((ln = br.readLine()) != null) {
									if (!ln.isEmpty()) {
										appendLogs(conn, id, ln + "\n");
										System.out.println(ln);
									}
								}

								br.close();
								isr.close();
								is.close();
								
								int exitCode = process.waitFor();
								
								if(exitCode != 0) { // The rendering failed.
									PreparedStatement psb = conn.prepareStatement("UPDATE songs SET log = concat(log, ?), uuid = ?, state = ? WHERE id = ?;");
									
									psb.setString(1, "\n---- Result ----\nVocalizing audio failed with exit code " + exitCode + "! Please try again later.\n");
									psb.setString(2, "https://youtu.be/" + videoId);
									psb.setString(3, "failed");
									psb.setInt(4, id);
									psb.executeUpdate();

									psb.close();
									
									System.out.printf("[%d] Vocalizing audio failed...\n", id);
									continue;
								}
								
								// The rendering worked.

								PreparedStatement psb = conn.prepareStatement("UPDATE songs SET log = concat(log, ?), uuid = ?, state = ? WHERE id = ?;");
								
								psb.setString(1, "\n---- Result ----\nSuccessfully rendered video. Elapsed time: " + (System.currentTimeMillis() - startTime) + "ms\n");
								psb.setString(2, "https://youtu.be/" + videoId);
								psb.setString(3, "completed");
								psb.setInt(4, id);
								psb.executeUpdate();
								
								psb.close();
								
								System.out.printf("[%d] Successfully rendered video. Elapsed Time: %d ms\n", id, System.currentTimeMillis() - startTime);
							} catch (Exception exc) {
								PreparedStatement psb = conn.prepareStatement("UPDATE songs SET log = ifnull(concat(log, ?), ?), state = ? WHERE id = ?;");
								
								String err = "\n---- Result ----\n" + (exc.getMessage() != null ? exc.getMessage() : exc.getClass().getName());
								psb.setString(1, err);
								psb.setString(2, err);
								psb.setString(3, "failed");
								psb.setInt(4, id);
								psb.executeUpdate();
								
								psb.close();

								exc.printStackTrace();
								continue;
							}
						}

						ps.close();
						rs.close();

						System.gc();
						Thread.sleep(1000L);
					}
				} catch (Exception ex) {
					ex.printStackTrace();
				} finally {
					if (conn != null)
						try {
							conn.close();
						} catch (Exception ex) {
							ex.printStackTrace();
						}
				}
			} catch (Exception e) {
				e.printStackTrace();
			}

			Thread.sleep(1000L);
		}
	}
}
