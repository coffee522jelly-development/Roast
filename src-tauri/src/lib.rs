mod mp3;
mod logger;

/// Roastアプリケーションのメインエントリポイント。
/// バックエンドの初期化、プラグインの登録、およびコマンドのハンドリング設定を行います。
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // 1. 診断用ロガーの初期化（パニックフックの設定を含む）
    // 実行ファイルと同じディレクトリ、またはTempディレクトリにログを出力します。
    logger::init();
    logger::log("ROAST_DEBUG: Rust run() started");

    // 2. Tauriコンテキストの生成
    // tauri.conf.json などの設定ファイルを読み込み、アセットを準備します。
    let context = tauri::generate_context!();
    logger::log("ROAST_DEBUG: Context generated");

    // 3. アプリケーションのビルドと起動
    tauri::Builder::default()
        // --- プラグインの登録 ---
        .plugin(tauri_plugin_opener::init()) // ファイルやURLをシステム標準のアプリで開く
        .plugin(tauri_plugin_dialog::init()) // ファイル選択ダイアログを表示する
        .plugin(tauri_plugin_fs::init())     // ファイルシステムの操作権限を管理する

        // --- フロントエンドから呼び出されるコマンドの登録 ---
        .invoke_handler(tauri::generate_handler![
            mp3::get_mp3_metadata,    // 指定フォルダからMP3の一覧とメタデータを取得
            mp3::get_mp3_artwork,     // 特定のMP3ファイルからアルバムアートを抽出
            mp3::update_mp3_metadata, // ID3タグの書き換え
            mp3::organize_mp3,        // アーティスト名に基づいた自動フォルダ整理
            mp3::read_audio_file,     // 再生用に音声ファイルをBase64で読み込み
            mp3::delete_mp3,          // ファイルの物理削除
            logger::log_to_file       // フロントエンドからのエラー情報をファイルに記録
        ])

        // --- セットアップ処理 ---
        .setup(|_app| {
            logger::log("ROAST_DEBUG: App setup complete");
            println!("ROAST: SETUP COMPLETE");
            Ok(())
        })

        // --- アプリケーションの実行 ---
        .run(context)
        .expect("error while running tauri application");
}
