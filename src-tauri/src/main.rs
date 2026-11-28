#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{Manager, WebviewWindowBuilder};
use tauri_plugin_dialog::DialogExt;
use tauri_plugin_opener::OpenerExt;

#[tauri::command]
async fn save_export(
    app: tauri::AppHandle,
    filename: String,
    contents: Vec<u8>,
) -> Result<bool, String> {
    let Some(path) = app
        .dialog()
        .file()
        .set_file_name(&filename)
        .blocking_save_file()
    else {
        return Ok(false);
    };
    let path = path.into_path().map_err(|error| error.to_string())?;
    std::fs::write(path, contents).map_err(|error| error.to_string())?;
    Ok(true)
}

#[tauri::command]
async fn open_external(app: tauri::AppHandle, url: String) -> Result<(), String> {
    let parsed = tauri::Url::parse(&url).map_err(|error| error.to_string())?;
    if !matches!(parsed.scheme(), "http" | "https") {
        return Err("Only HTTP and HTTPS links can be opened.".into());
    }
    app.opener()
        .open_url(url, None::<&str>)
        .map_err(|error| error.to_string())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![save_export, open_external])
        .setup(|app| {
            let config = &app.config().app.windows[0];
            let window = WebviewWindowBuilder::from_config(app, config)?;
            // Reuse the WebView2 profile created by earlier Pake builds.
            #[cfg(target_os = "windows")]
            let window = window.data_directory(app.path().config_dir()?.join("Wireframe"));
            window.build()?;
            Ok(())
        })
        .on_window_event(|window, event| {
            #[cfg(target_os = "macos")]
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                match window.hide() {
                    Ok(()) => api.prevent_close(),
                    Err(error) => eprintln!("Could not hide the window: {error}"),
                }
            }
            #[cfg(not(target_os = "macos"))]
            let _ = (window, event);
        })
        .build(tauri::generate_context!())
        .expect("Failed to build TruRun")
        .run(|app, event| {
            #[cfg(target_os = "macos")]
            if let tauri::RunEvent::Reopen {
                has_visible_windows: false,
                ..
            } = event
            {
                if let Some(window) = app.get_webview_window("main") {
                    if let Err(error) = window.show().and_then(|_| window.set_focus()) {
                        eprintln!("Could not reopen the window: {error}");
                    }
                }
            }
            #[cfg(not(target_os = "macos"))]
            let _ = (app, event);
        });
}
