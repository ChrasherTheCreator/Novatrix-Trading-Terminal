use serde::{Deserialize, Serialize};
use serde_json::json;
use anyhow::Result;
use tracing::{info, error};
use std::env;

#[derive(Debug, Serialize, Deserialize)]
pub struct AIAnalysisRequest {
    pub trade_id: String,
    pub prompt_type: String, // "review", "psychology", "strategy"
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AIAnalysisResponse {
    pub analysis: String,
    pub confidence_score: f64,
    pub suggestions: Vec<String>,
}

pub async fn analyze_trade_data(trade_data: serde_json::Value, prompt_type: &str) -> Result<AIAnalysisResponse> {
    let api_key = env::var("OPENAI_API_KEY").map_err(|_| anyhow::anyhow!("OPENAI_API_KEY not set"))?;
    let client = reqwest::Client::new();

    let system_prompt = match prompt_type {
        "psychology" => "You are a trading psychology expert. Analyze the trade for emotional biases like FOMO, revenge trading, or greed.",
        "strategy" => "You are a systematic trading strategist. Review if the trade follows sound risk-to-reward principles and technical logic.",
        _ => "You are a professional risk manager. Provide a concise review of this trade execution.",
    };

    info!("Sending analysis request to OpenAI for trade data");

    let response = client
        .post("https://api.openai.com/v1/chat/completions")
        .header("Authorization", format!("Bearer {}", api_key))
        .json(&json!({
            "model": "gpt-4o",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": format!("Analyze this trade data: {}", trade_data.to_string())}
            ],
            "response_format": { "type": "json_object" }
        }))
        .send()
        .await?;

    if !response.status().is_success() {
        let err_text = response.text().await?;
        error!("AI API error: {}", err_text);
        return Err(anyhow::anyhow!("AI API failed: {}", err_text));
    }

    let result: serde_json::Value = response.json().await?;
    let content = result["choices"][0]["message"]["content"]
        .as_str()
        .ok_or_else(|| anyhow::anyhow!("Invalid AI response format"))?;

    let analysis: AIAnalysisResponse = serde_json::from_str(content)?;
    Ok(analysis)
}
