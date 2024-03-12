use serde;
use std::collections::HashMap;

use axum::Json;
use evcxr::{FunctionArg, SharedLibFunctions};

#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct ScopeSymbol {
    #[serde(rename = "varName")]
    var_name: String,
    #[serde(rename = "varType")]
    var_type: String,
    #[serde(rename = "hintValue")]
    hint_value: Option<String>,
}

#[derive(serde::Serialize)]
pub(crate) struct Signature {
    inputs: Vec<ScopeSymbol>,
    outputs: Vec<ScopeSymbol>,
}

#[derive(serde::Serialize)]
pub(crate) struct CompiledFn {
    #[serde(rename = "fnId")]
    fn_id: String,
    signature: Signature,
}

impl From<ScopeSymbol> for FunctionArg {
    fn from(symbol: ScopeSymbol) -> Self {
        FunctionArg {
            arg_name: symbol.var_name,
            arg_type: symbol.var_type,
        }
    }
}

impl From<FunctionArg> for ScopeSymbol {
    fn from(arg: FunctionArg) -> Self {
        ScopeSymbol {
            var_name: arg.arg_name,
            var_type: arg.arg_type,
            hint_value: None,
        }
    }
}

type Scope = Vec<ScopeSymbol>;

#[derive(serde::Deserialize)]
pub(crate) struct CellContents {
    code: String,
    options: HashMap<String, String>,
    scope: Scope,
    #[serde(rename = "workerUrl")]
    worker_url: String,
}

pub(crate) async fn compile(Json(cell_contents): Json<CellContents>) -> Json<CompiledFn> {
    let scope: Vec<_> = cell_contents
        .scope
        .into_iter()
        .map(|symbol| symbol.into())
        .collect();
    let mut shared_lib = SharedLibFunctions::new();
    let (inputs, outputs) = shared_lib
        .add_fn("add", &cell_contents.code, &scope)
        .unwrap();
    let inputs: Vec<_> = inputs.into_iter().map(|arg| arg.clone().into()).collect();
    let outputs: Vec<_> = outputs.into_iter().map(|arg| arg.clone().into()).collect();
    let signature = Signature { inputs, outputs };
    CompiledFn {
        fn_id: "add".to_string(),
        signature,
    }
    .into()
}
