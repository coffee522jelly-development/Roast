pub mod mp3;

#[tauri::command]
pub fn get_mp3_metadata(dir_path: String) -> Result<Vec<mp3::Mp3Metadata>, String> {
    mp3::get_mp3_metadata_logic(dir_path)
}

#[tauri::command]
pub fn update_mp3_metadata(path: String, metadata: mp3::Mp3Metadata) -> Result<(), String> {
    mp3::update_mp3_metadata_logic(path, metadata)
}

#[tauri::command]
pub fn organize_mp3(path: String) -> Result<String, String> {
    mp3::organize_mp3_logic(path)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            get_mp3_metadata,
            update_mp3_metadata,
            organize_mp3
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
