// main tauri entry


#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{Builder, Manager};
use std::process::{Command, Child};
use std::sync::{Arc, Mutex};


// run python script
#[tauri::command]
fn run_python_script(script: String) -> String {
    // run python script and return output
    // use portable python.exe from release folder
    let exe_path = std::env::current_exe().unwrap();
    let exe_dir = exe_path.parent().unwrap();
    let python_path = exe_dir.join("python.exe");
    let output = Command::new(python_path)
        .arg(script)
        .output()
        .expect("failed to run python script");
    String::from_utf8_lossy(&output.stdout).to_string()
}


fn main() {
    Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![run_python_script])
        .setup(|app| {
            // devtools
            #[cfg(debug_assertions)]
            {
                let window = app.get_webview_window("main").unwrap();
                window.open_devtools();
            }
            // start backend server
            let exe_path = std::env::current_exe().unwrap();
            let exe_dir = exe_path.parent().unwrap();
            let server_js_path = exe_dir.join("backend").join("server.js");
            let log_path = exe_dir.join("backend.log");
            let log_file = std::fs::File::create(log_path).expect("could not create log file");

            #[cfg(windows)]
            use std::os::windows::process::CommandExt;
            #[cfg(windows)]
            let creation_flags = 0x08000000; // CREATE_NO_WINDOW

            // use portable node
            let node_path = exe_dir.join("redistributable").join("node").join("node.exe");
            let mut backend_cmd = Command::new(node_path);
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
