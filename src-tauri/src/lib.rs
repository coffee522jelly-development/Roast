mod mp3;
mod logger;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    logger::init();
    logger::log("ROAST_DEBUG: Rust run() started");

    let context = tauri::generate_context!();
    logger::log("ROAST_DEBUG: Context generated");

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            mp3::get_mp3_metadata,
            mp3::get_mp3_artwork,
            mp3::update_mp3_metadata,
            mp3::organize_mp3,
            mp3::read_audio_file,
            mp3::delete_mp3,
            logger::log_to_file
        ])
        .setup(|_app| {
            logger::log("ROAST_DEBUG: App setup complete");
            println!("ROAST: SETUP COMPLETE");
            Ok(())
        })
        .run(context)
        .expect("error while running tauri application");
}
