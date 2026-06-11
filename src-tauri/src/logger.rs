use std::fs::OpenOptions;
use std::io::Write;
use std::env;

pub fn log(msg: &str) {
    if let Ok(exe_path) = env::current_exe() {
        if let Some(dir) = exe_path.parent() {
            let log_path = dir.join("roast_crash_log.txt");
            if let Ok(mut file) = OpenOptions::new()
                .create(true)
                .append(true)
                .open(log_path) {
                let _ = writeln!(file, "{}", msg);
            }
        }
    }
}

pub fn init() {
    std::panic::set_hook(Box::new(|panic_info| {
        let msg = format!("PANIC: {}", panic_info);
        log(&msg);
    }));
    log(&format!("--- ROAST STARTUP at {} ---", chrono::Local::now().format("%Y-%m-%d %H:%M:%S")));
}

#[tauri::command]
pub fn log_to_file(msg: String) {
    log(&format!("FRONTEND: {}", msg));
}
