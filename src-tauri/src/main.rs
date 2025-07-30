// main tauri entry


#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Builder;
use std::process::Command;


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
        .setup(|_app| {
            // start backend server and log output to file
            let exe_path = std::env::current_exe().unwrap();
            let log_path = exe_path.parent().unwrap().join("backend.log");
            let log_file = std::fs::File::create(log_path).expect("could not create log file");
            // get project root (two levels up from exe)
            let project_root = exe_path
                .parent().unwrap()
                .parent().unwrap()
                .parent().unwrap();
            let _child = Command::new("node")
                .arg("../backend/server.js")
                .current_dir(project_root)
                .stdout(log_file.try_clone().unwrap())
                .stderr(log_file)
                .spawn();
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri app");
}
