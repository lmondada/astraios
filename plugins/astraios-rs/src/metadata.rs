use axum::Json;

#[derive(serde::Serialize)]
pub(crate) struct Metadata {
    name: String,
    #[serde(rename = "supportedWorkers")]
    supported_workers: Vec<String>,
}

impl Default for Metadata {
    fn default() -> Self {
        Self {
            name: "Rust".to_string(),
            supported_workers: vec!["http://127.0.0.1:9000".to_string()],
        }
    }
}

pub(crate) async fn metadata() -> Json<Metadata> {
    Metadata::default().into()
}
