use std::fs::OpenOptions;
use std::io::Write;
use std::env;

pub fn log(msg: &str) {
    let mut log_path = env::temp_dir();
    log_path.push("roast_crash_log.txt");

    if let Ok(mut file) = OpenOptions::new()
        .create(true)
        .append(true)
        .open(log_path) {
        let _ = writeln!(file, "{}", msg);
    }
}

pub fn init() {
    std::panic::set_hook(Box::new(|panic_info| {
        let msg = format!("PANIC: {}", panic_info);
        log(&msg);
    }));
    log("--- ROAST STARTUP ---");
}

#[tauri::command]
pub fn log_to_file(msg: String) {
    log(&format!("FRONTEND: {}", msg));
}
