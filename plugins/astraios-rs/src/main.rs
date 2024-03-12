mod compile;
mod metadata;

use axum::http::Method;
use axum::Json;
use axum::{routing::get, routing::post, Router};
use tower_http::cors::{Any, CorsLayer};

use crate::compile::compile;
use crate::metadata::metadata;

#[tokio::main]
async fn main() {
    let app = Router::new()
        .route("/compile", post(compile))
        .route("/metadata", get(metadata))
        .route(
            "/create",
            post(|| async { Json("http://127.0.0.1:9000".to_string()) }),
        )
        .layer(
            CorsLayer::new()
                // allow `GET` and `POST` when accessing the resource
                .allow_methods([Method::GET, Method::POST])
                // allow requests from any origin
                .allow_origin(Any),
        );

    // run our app with hyper, listening globally on port 9000
    let listener = tokio::net::TcpListener::bind("0.0.0.0:9000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
