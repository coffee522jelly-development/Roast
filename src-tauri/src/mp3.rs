use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use walkdir::WalkDir;
use id3::{Tag, TagLike};
use base64::{Engine as _, engine::general_purpose};
use mp3_duration;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Mp3Metadata {
    pub path: String,
    pub filename: String,
    pub title: Option<String>,
    pub artist: Option<String>,
    pub album: Option<String>,
    pub year: Option<i32>,
    pub duration: Option<u64>,     // In seconds
    pub size: u64,               // In bytes
    pub is_locked: bool,
}

#[tauri::command]
pub fn get_mp3_metadata(dir_path: String) -> Result<Vec<Mp3Metadata>, String> {
    let mut results = Vec::new();
    for entry in WalkDir::new(&dir_path).into_iter().filter_map(|e| e.ok()) {
        let path = entry.path();
        if path.extension().and_then(|s| s.to_str()).map(|s| s.to_lowercase()) == Some("mp3".to_string()) {
            let metadata = read_metadata(path)?;
            results.push(metadata);
        }
    }
    Ok(results)
}

#[tauri::command]
pub fn get_mp3_artwork(path: String) -> Result<Option<String>, String> {
    let tag = Tag::read_from_path(&path).ok();
    let artwork = tag.as_ref().and_then(|t| {
        t.pictures().next().map(|p| {
            let b64 = general_purpose::STANDARD.encode(&p.data);
            format!("data:{};base64,{}", p.mime_type, b64)
        })
    });
    Ok(artwork)
}

pub fn read_metadata(path: &Path) -> Result<Mp3Metadata, String> {
    // Normalize path: absolute and using forward slashes for better cross-platform/Tauri URL behavior
    let abs_path = fs::canonicalize(path).unwrap_or_else(|_| path.to_path_buf());
    let mut path_str = abs_path.to_string_lossy().to_string();

    // Strip Windows UNC prefix if present (very important for convertFileSrc on Windows)
    if path_str.starts_with(r"\\?\") {
        path_str = path_str[4..].to_string();
    }
    // Note: Do NOT replace backslashes with forward slashes yet,
    // as convertFileSrc usually expects the platform's native path format.

    // Check if file is readable/locked
    let is_locked = fs::OpenOptions::new().read(true).open(&abs_path).is_err();

    let tag = Tag::read_from_path(&abs_path).ok();
    let filename = abs_path.file_name()
        .and_then(|s| s.to_str())
        .unwrap_or_default()
        .to_string();

    let duration = mp3_duration::from_path(&abs_path)
        .ok()
        .map(|d| d.as_secs());

    let size = fs::metadata(&abs_path)
        .map(|m| m.len())
        .unwrap_or(0);

    Ok(Mp3Metadata {
        path: path_str,
        filename,
        title: tag.as_ref().and_then(|t| t.title().map(|s| s.to_string())),
        artist: tag.as_ref().and_then(|t| t.artist().map(|s| s.to_string())),
        album: tag.as_ref().and_then(|t| t.album().map(|s| s.to_string())),
        year: tag.as_ref().and_then(|t| t.year()),
        duration,
        size,
        is_locked,
    })
}

#[tauri::command]
pub fn update_mp3_metadata(path: String, metadata: Mp3Metadata) -> Result<(), String> {
    let path_buf = PathBuf::from(&path);
    let mut tag = Tag::read_from_path(&path_buf).unwrap_or_default();

    if let Some(title) = metadata.title {
        tag.set_title(title);
    }
    if let Some(artist) = metadata.artist {
        tag.set_artist(artist);
    }
    if let Some(album) = metadata.album {
        tag.set_album(album);
    }
    if let Some(year) = metadata.year {
        tag.set_year(year);
    }

    tag.write_to_path(&path_buf, id3::Version::Id3v24)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn organize_mp3(path: String) -> Result<String, String> {
    let original_path = PathBuf::from(&path);
    let filename = original_path.file_name()
        .and_then(|s| s.to_str())
        .ok_or("Invalid filename")?;

    // Try to split filename by " - " to find artist
    let parts: Vec<&str> = filename.splitn(2, " - ").collect();
    if parts.len() < 2 {
        return Err("Filename does not contain ' - ' separator".to_string());
    }

    let artist = parts[0].trim();
    let rest = parts[1].trim();

    let parent_dir = original_path.parent().ok_or("Could not find parent directory")?;
    let artist_dir = parent_dir.join(artist);

    if !artist_dir.exists() {
        fs::create_dir(&artist_dir).map_err(|e| e.to_string())?;
    }

    let new_path = artist_dir.join(rest);
    fs::rename(&original_path, &new_path).map_err(|e| e.to_string())?;

    // Update ID3 tags
    let mut tag = Tag::read_from_path(&new_path).unwrap_or_default();
    tag.set_artist(artist);

    let title = Path::new(rest)
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or(rest);
    tag.set_title(title);

    tag.write_to_path(&new_path, id3::Version::Id3v24)
        .map_err(|e| e.to_string())?;

    Ok(new_path.to_string_lossy().to_string())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs::File;
    use tempfile::tempdir;

    #[test]
    fn test_organize_mp3_logic() {
        let dir = tempdir().unwrap();
        let file_path = dir.path().join("Artist Name - Song Title.mp3");
        File::create(&file_path).unwrap();

        let result = organize_mp3(file_path.to_string_lossy().to_string()).unwrap();

        let expected_path = dir.path().join("Artist Name").join("Song Title.mp3");
        assert!(expected_path.exists());
        // Since organize_mp3 doesn't use canonicalize internally for result string yet,
        // we check if it contains the expected parts.
        assert!(result.contains("Artist Name"));
        assert!(result.contains("Song Title.mp3"));

        // Verify tags
        let tag = Tag::read_from_path(&expected_path).unwrap();
        assert_eq!(tag.artist(), Some("Artist Name"));
        assert_eq!(tag.title(), Some("Song Title"));
    }
}
