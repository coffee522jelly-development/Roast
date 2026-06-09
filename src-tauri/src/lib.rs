mod mp3;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    println!("ROAST_DEBUG: Rust run() started");

    let context = tauri::generate_context!();
    println!("ROAST_DEBUG: Context generated");

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
            mp3::delete_mp3
        ])
        .setup(|_app| {
            println!("ROAST_DEBUG: App setup complete");
            Ok(())
        })
        .run(context)
        .expect("error while running tauri application");
}
