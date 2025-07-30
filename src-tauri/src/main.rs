// main tauri entry


#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{Builder, Manager};
use tauri::State;
use std::fs::OpenOptions;
use std::io::Write;
use std::process::{Command, Child};
use std::sync::{Arc, Mutex};


// run python script
#[tauri::command]
fn run_python_script(script: String) -> String {
    // run python script and return output
    let output = Command::new("python")
        .arg(script)
        .output()
        .expect("failed to run python script");
    String::from_utf8_lossy(&output.stdout).to_string()
}


fn main() {
    Builder::default()
        .invoke_handler(tauri::generate_handler![run_python_script])
        .setup(|app| {
            // devtools
            #[cfg(debug_assertions)]
            {
                let window = app.get_webview_window("main").unwrap();
                window.open_devtools();
            }
            // start backend server and log output to file
            let exe_path = std::env::current_exe().unwrap();
            let exe_dir = exe_path.parent().unwrap();
            let log_path = exe_dir.join("backend.log");
            let log_file = std::fs::File::create(log_path).expect("could not create log file");
            // path to server.js
            let server_js_path = exe_dir.join("backend").join("server.js");

            #[cfg(windows)]
            use std::os::windows::process::CommandExt;
            #[cfg(windows)]
            let creation_flags = 0x08000000; // CREATE_NO_WINDOW

            let mut backend_cmd = Command::new("node");
            backend_cmd.arg(server_js_path)
                .current_dir(exe_dir)
                .stdout(log_file.try_clone().unwrap())
                .stderr(log_file);
            #[cfg(windows)]
            backend_cmd.creation_flags(creation_flags);

            let child = backend_cmd.spawn().expect("failed to start backend");
            let child = Arc::new(Mutex::new(child));
            app.manage(child);
            Ok(())
        })
        .on_window_event(|app_handle, event| {
            // kill backend when all windows are closed
            use tauri::WindowEvent;
            if let WindowEvent::CloseRequested { .. } = event {
                if let Some(child_arc) = app_handle.try_state::<Arc<Mutex<Child>>>() {
                    if let Ok(mut child) = child_arc.lock() {
                        let _ = child.kill();
                    }
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri app");
}
