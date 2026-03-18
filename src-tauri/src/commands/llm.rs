use crate::commands::ConnectionConfig;
use crate::commands::vector::{VectorSearchRequest, VectorSearchResult};
use crate::redis_client::RedisManager;
use serde::{Deserialize, Serialize};
use std::time::Duration;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum LLMProvider {
    OpenAI,
    Anthropic,
    Ollama,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum LLMModel {
    #[serde(rename = "gpt-4")]
    GPT4,
    #[serde(rename = "gpt-4-turbo")]
    GPT4Turbo,
    #[serde(rename = "gpt-3.5-turbo")]
    GPT35Turbo,
    #[serde(rename = "claude-3-opus")]
    Claude3Opus,
    #[serde(rename = "claude-3-sonnet")]
    Claude3Sonnet,
    #[serde(rename = "claude-3-haiku")]
    Claude3Haiku,
    #[serde(rename = "llama2")]
    Llama2,
    #[serde(rename = "mistral")]
    Mistral,
}

impl LLMModel {
    pub fn provider(&self) -> LLMProvider {
        match self {
            LLMModel::GPT4 | LLMModel::GPT4Turbo | LLMModel::GPT35Turbo => LLMProvider::OpenAI,
            LLMModel::Claude3Opus | LLMModel::Claude3Sonnet | LLMModel::Claude3Haiku => {
                LLMProvider::Anthropic
            }
            LLMModel::Llama2 | LLMModel::Mistral => LLMProvider::Ollama,
        }
    }

    pub fn as_str(&self) -> &'static str {
        match self {
            LLMModel::GPT4 => "gpt-4",
            LLMModel::GPT4Turbo => "gpt-4-turbo",
            LLMModel::GPT35Turbo => "gpt-3.5-turbo",
            LLMModel::Claude3Opus => "claude-3-opus-20240229",
            LLMModel::Claude3Sonnet => "claude-3-sonnet-20240229",
            LLMModel::Claude3Haiku => "claude-3-haiku-20240307",
            LLMModel::Llama2 => "llama2",
            LLMModel::Mistral => "mistral",
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LLMMessage {
    pub role: String,
    pub content: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LLMRequest {
    pub model: LLMModel,
    pub messages: Vec<LLMMessage>,
    pub temperature: Option<f32>,
    pub max_tokens: Option<u32>,
    pub stream: Option<bool>,
    pub api_key: Option<String>,
    pub api_endpoint: Option<String>, // For Ollama or custom endpoints
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LLMResponse {
    pub content: String,
    pub model: String,
    pub usage: Option<LLMUsage>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LLMUsage {
    pub prompt_tokens: u32,
    pub completion_tokens: u32,
    pub total_tokens: u32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LLMStreamChunk {
    pub content: String,
    pub done: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RAGRequest {
    pub query: String,
    pub model: LLMModel,
    pub index_name: String,
    pub vector_field: String,
    pub top_k: usize,
    pub temperature: Option<f32>,
    pub max_tokens: Option<u32>,
    pub api_key: Option<String>,
    pub api_endpoint: Option<String>,
    pub conversation_history: Option<Vec<LLMMessage>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RAGResponse {
    pub answer: String,
    pub sources: Vec<RAGSource>,
    pub usage: Option<LLMUsage>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RAGSource {
    pub key: String,
    pub score: f64,
    pub snippet: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct EmbeddingRequest {
    pub text: String,
    pub model: Option<String>, // e.g., "text-embedding-ada-002"
    pub provider: LLMProvider,
    pub api_key: Option<String>,
    pub api_endpoint: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct EmbeddingResponse {
    pub embedding: Vec<f64>,
    pub model: String,
}

// OpenAI API types
#[derive(Debug, Serialize)]
struct OpenAIRequest {
    model: String,
    messages: Vec<OpenAIMessage>,
    temperature: Option<f32>,
    max_tokens: Option<u32>,
    stream: Option<bool>,
}

#[derive(Debug, Serialize)]
struct OpenAIMessage {
    role: String,
    content: String,
}

#[derive(Debug, Deserialize)]
struct OpenAIResponse {
    choices: Vec<OpenAIChoice>,
    usage: OpenAIUsage,
    model: String,
}

#[derive(Debug, Deserialize)]
struct OpenAIChoice {
    message: OpenAIMessageResponse,
    finish_reason: Option<String>,
}

#[derive(Debug, Deserialize)]
struct OpenAIMessageResponse {
    role: String,
    content: String,
}

#[derive(Debug, Deserialize)]
struct OpenAIUsage {
    prompt_tokens: u32,
    completion_tokens: u32,
    total_tokens: u32,
}

// Anthropic API types
#[derive(Debug, Serialize)]
struct AnthropicRequest {
    model: String,
    messages: Vec<AnthropicMessage>,
    max_tokens: u32,
    temperature: Option<f32>,
    stream: Option<bool>,
}

#[derive(Debug, Serialize)]
struct AnthropicMessage {
    role: String,
    content: String,
}

#[derive(Debug, Deserialize)]
struct AnthropicResponse {
    content: Vec<AnthropicContent>,
    model: String,
    usage: AnthropicUsage,
}

#[derive(Debug, Deserialize)]
struct AnthropicContent {
    #[serde(rename = "type")]
    r#type: String,
    text: String,
}

#[derive(Debug, Deserialize)]
struct AnthropicUsage {
    input_tokens: u32,
    output_tokens: u32,
}

// Ollama API types
#[derive(Debug, Serialize)]
struct OllamaRequest {
    model: String,
    messages: Vec<OllamaMessage>,
    stream: Option<bool>,
}

#[derive(Debug, Serialize)]
struct OllamaMessage {
    role: String,
    content: String,
}

#[derive(Debug, Deserialize)]
struct OllamaResponse {
    message: OllamaMessageResponse,
    model: String,
}

#[derive(Debug, Deserialize)]
struct OllamaMessageResponse {
    role: String,
    content: String,
}

pub struct LLMClient {
    api_key: Option<String>,
    endpoint: Option<String>,
    timeout: Duration,
}

impl LLMClient {
    pub fn new(api_key: Option<String>, endpoint: Option<String>) -> Self {
        Self {
            api_key,
            endpoint,
            timeout: Duration::from_secs(60),
        }
    }

    pub async fn chat_completion(&self, request: &LLMRequest) -> Result<LLMResponse, String> {
        match request.model.provider() {
            LLMProvider::OpenAI => self.openai_chat(request).await,
            LLMProvider::Anthropic => self.anthropic_chat(request).await,
            LLMProvider::Ollama => self.ollama_chat(request).await,
        }
    }

    async fn openai_chat(&self, request: &LLMRequest) -> Result<LLMResponse, String> {
        let endpoint = self
            .endpoint
            .as_ref()
            .map(|s| s.as_str())
            .unwrap_or("https://api.openai.com/v1/chat/completions");

        let api_key = self
            .api_key
            .as_ref()
            .ok_or("OpenAI API key is required")?;

        let openai_request = OpenAIRequest {
            model: request.model.as_str().to_string(),
            messages: request
                .messages
                .iter()
                .map(|m| OpenAIMessage {
                    role: m.role.clone(),
                    content: m.content.clone(),
                })
                .collect(),
            temperature: request.temperature,
            max_tokens: request.max_tokens,
            stream: Some(false),
        };

        let client = reqwest::Client::new();
        let response = client
            .post(endpoint)
            .header("Authorization", format!("Bearer {}", api_key))
            .header("Content-Type", "application/json")
            .json(&openai_request)
            .timeout(self.timeout)
            .send()
            .await
            .map_err(|e| format!("OpenAI API request failed: {}", e))?;

        if !response.status().is_success() {
            let error_text = response
                .text()
                .await
                .unwrap_or_else(|_| "Unknown error".to_string());
            return Err(format!("OpenAI API error: {}", error_text));
        }

        let openai_response: OpenAIResponse = response
            .json()
            .await
            .map_err(|e| format!("Failed to parse OpenAI response: {}", e))?;

        let content = openai_response
            .choices
            .first()
            .ok_or("No response from OpenAI")?
            .message
            .content
            .clone();

        Ok(LLMResponse {
            content,
            model: openai_response.model,
            usage: Some(LLMUsage {
                prompt_tokens: openai_response.usage.prompt_tokens,
                completion_tokens: openai_response.usage.completion_tokens,
                total_tokens: openai_response.usage.total_tokens,
            }),
        })
    }

    async fn anthropic_chat(&self, request: &LLMRequest) -> Result<LLMResponse, String> {
        let endpoint = self
            .endpoint
            .as_ref()
            .map(|s| s.as_str())
            .unwrap_or("https://api.anthropic.com/v1/messages");

        let api_key = self
            .api_key
            .as_ref()
            .ok_or("Anthropic API key is required")?;

        let anthropic_request = AnthropicRequest {
            model: request.model.as_str().to_string(),
            messages: request
                .messages
                .iter()
                .map(|m| AnthropicMessage {
                    role: m.role.clone(),
                    content: m.content.clone(),
                })
                .collect(),
            max_tokens: request.max_tokens.unwrap_or(4096),
            temperature: request.temperature,
            stream: Some(false),
        };

        let client = reqwest::Client::new();
        let response = client
            .post(endpoint)
            .header("x-api-key", api_key)
            .header("anthropic-version", "2023-06-01")
            .header("Content-Type", "application/json")
            .json(&anthropic_request)
            .timeout(self.timeout)
            .send()
            .await
            .map_err(|e| format!("Anthropic API request failed: {}", e))?;

        if !response.status().is_success() {
            let error_text = response
                .text()
                .await
                .unwrap_or_else(|_| "Unknown error".to_string());
            return Err(format!("Anthropic API error: {}", error_text));
        }

        let anthropic_response: AnthropicResponse = response
            .json()
            .await
            .map_err(|e| format!("Failed to parse Anthropic response: {}", e))?;

        let content = anthropic_response
            .content
            .iter()
            .filter(|c| c.r#type == "text")
            .map(|c| c.text.clone())
            .collect::<Vec<_>>()
            .join("\n");

        Ok(LLMResponse {
            content,
            model: anthropic_response.model,
            usage: Some(LLMUsage {
                prompt_tokens: anthropic_response.usage.input_tokens,
                completion_tokens: anthropic_response.usage.output_tokens,
                total_tokens: anthropic_response.usage.input_tokens + anthropic_response.usage.output_tokens,
            }),
        })
    }

    async fn ollama_chat(&self, request: &LLMRequest) -> Result<LLMResponse, String> {
        let endpoint = self
            .endpoint
            .as_ref()
            .map(|s| s.as_str())
            .unwrap_or("http://localhost:11434/api/chat");

        let ollama_request = OllamaRequest {
            model: request.model.as_str().to_string(),
            messages: request
                .messages
                .iter()
                .map(|m| OllamaMessage {
                    role: m.role.clone(),
                    content: m.content.clone(),
                })
                .collect(),
            stream: Some(false),
        };

        let client = reqwest::Client::new();
        let response = client
            .post(endpoint)
            .header("Content-Type", "application/json")
            .json(&ollama_request)
            .timeout(self.timeout)
            .send()
            .await
            .map_err(|e| format!("Ollama API request failed: {}", e))?;

        if !response.status().is_success() {
            let error_text = response
                .text()
                .await
                .unwrap_or_else(|_| "Unknown error".to_string());
            return Err(format!("Ollama API error: {}", error_text));
        }

        let ollama_response: OllamaResponse = response
            .json()
            .await
            .map_err(|e| format!("Failed to parse Ollama response: {}", e))?;

        Ok(LLMResponse {
            content: ollama_response.message.content,
            model: ollama_response.model,
            usage: None, // Ollama doesn't provide token usage
        })
    }

    pub async fn generate_embedding(&self, request: &EmbeddingRequest) -> Result<EmbeddingResponse, String> {
        match request.provider {
            LLMProvider::OpenAI => self.openai_embedding(request).await,
            LLMProvider::Ollama => self.ollama_embedding(request).await,
            _ => Err("Embeddings not supported for this provider".to_string()),
        }
    }

    async fn openai_embedding(&self, request: &EmbeddingRequest) -> Result<EmbeddingResponse, String> {
        let endpoint = "https://api.openai.com/v1/embeddings";
        let model = request.model.as_deref().unwrap_or("text-embedding-ada-002");
        let api_key = self.api_key.as_ref().ok_or("API key is required")?;

        #[derive(Debug, Serialize)]
        struct OpenAIEmbeddingRequest {
            model: String,
            input: String,
        }

        #[derive(Debug, Deserialize)]
        struct OpenAIEmbeddingResponse {
            data: Vec<OpenAIEmbeddingData>,
            model: String,
        }

        #[derive(Debug, Deserialize)]
        struct OpenAIEmbeddingData {
            embedding: Vec<f64>,
        }

        let client = reqwest::Client::new();
        let response = client
            .post(endpoint)
            .header("Authorization", format!("Bearer {}", api_key))
            .json(&OpenAIEmbeddingRequest {
                model: model.to_string(),
                input: request.text.clone(),
            })
            .timeout(self.timeout)
            .send()
            .await
            .map_err(|e| format!("OpenAI Embedding API request failed: {}", e))?;

        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_default();
            return Err(format!("OpenAI Embedding API error: {}", error_text));
        }

        let openai_response: OpenAIEmbeddingResponse = response
            .json()
            .await
            .map_err(|e| format!("Failed to parse embedding response: {}", e))?;

        let embedding = openai_response
            .data
            .first()
            .ok_or("No embedding in response")?
            .embedding
            .clone();

        Ok(EmbeddingResponse {
            embedding,
            model: openai_response.model,
        })
    }

    async fn ollama_embedding(&self, request: &EmbeddingRequest) -> Result<EmbeddingResponse, String> {
        let endpoint = self
            .endpoint
            .as_ref()
            .map(|s| s.as_str())
            .unwrap_or("http://localhost:11434/api/embeddings");

        #[derive(Debug, Serialize)]
        struct OllamaEmbeddingRequest {
            model: String,
            prompt: String,
        }

        #[derive(Debug, Deserialize)]
        struct OllamaEmbeddingResponse {
            embedding: Vec<f64>,
        }

        let model = request.model.as_deref().unwrap_or("llama2");
        let client = reqwest::Client::new();
        let response = client
            .post(endpoint)
            .json(&OllamaEmbeddingRequest {
                model: model.to_string(),
                prompt: request.text.clone(),
            })
            .timeout(self.timeout)
            .send()
            .await
            .map_err(|e| format!("Ollama Embedding API request failed: {}", e))?;

        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_default();
            return Err(format!("Ollama Embedding API error: {}", error_text));
        }

        let ollama_response: OllamaEmbeddingResponse = response
            .json()
            .await
            .map_err(|e| format!("Failed to parse embedding response: {}", e))?;

        Ok(EmbeddingResponse {
            embedding: ollama_response.embedding,
            model: model.to_string(),
        })
    }
}

// Tauri commands
#[tauri::command]
pub async fn llm_chat(request: LLMRequest) -> Result<LLMResponse, String> {
    let client = LLMClient::new(request.api_key.clone(), request.api_endpoint.clone());
    client.chat_completion(&request).await
}

#[tauri::command]
pub async fn llm_rag(
    config: ConnectionConfig,
    request: RAGRequest,
) -> Result<RAGResponse, String> {
    // Step 1: Generate embedding for the query
    let llm_client = LLMClient::new(request.api_key.clone(), request.api_endpoint.clone());
    let embedding_request = EmbeddingRequest {
        text: request.query.clone(),
        model: Some("text-embedding-ada-002".to_string()),
        provider: request.model.provider(),
        api_key: request.api_key.clone(),
    };

    let embedding_response = llm_client
        .generate_embedding(&embedding_request)
        .await
        .map_err(|e| format!("Failed to generate embedding: {}", e))?;

    // Step 2: Search Redis for similar documents
    let mut redis_manager = RedisManager::new(config);
    let vector_search_request = VectorSearchRequest {
        index_name: request.index_name.clone(),
        query_vector: embedding_response.embedding,
        vector_field: request.vector_field.clone(),
        top_k: Some(request.top_k),
        return_fields: Some(vec!["content".to_string(), "title".to_string()]),
    };

    let search_results = redis_manager
        .vector_search(&vector_search_request)
        .await
        .map_err(|e| format!("Vector search failed: {}", e))?;

    // Step 3: Build RAG context
    let context = build_rag_context(&search_results);

    // Step 4: Create enhanced prompt with context
    let mut messages = request.conversation_history.clone().unwrap_or_default();

    // Add system message with context
    let system_message = LLMMessage {
        role: "system".to_string(),
        content: format!(
            "You are a helpful assistant. Use the following context from the knowledge base to answer the user's question:\n\n{}\n\nIf the context doesn't contain relevant information, say so. Don't make up information.",
            context
        ),
    };

    messages.insert(0, system_message);

    // Add user message
    messages.push(LLMMessage {
        role: "user".to_string(),
        content: request.query,
    });

    // Step 5: Get LLM response
    let llm_request = LLMRequest {
        model: request.model,
        messages,
        temperature: request.temperature,
        max_tokens: request.max_tokens,
        stream: Some(false),
        api_key: request.api_key,
        api_endpoint: request.api_endpoint,
    };

    let llm_response = llm_client.chat_completion(&llm_request).await?;

    // Step 6: Build RAG response with sources
    let sources = search_results
        .into_iter()
        .map(|result| RAGSource {
            key: result.key,
            score: result.score,
            snippet: result.fields.and_then(|f| {
                f.get("content")
                    .or_else(|| f.get("title"))
                    .and_then(|v| v.as_str())
                    .map(|s| {
                        if s.len() > 200 {
                            s.chars().take(200).collect::<String>() + "..."
                        } else {
                            s.to_string()
                        }
                    })
            }),
        })
        .collect();

    Ok(RAGResponse {
        answer: llm_response.content,
        sources,
        usage: llm_response.usage,
    })
}

#[tauri::command]
pub async fn llm_generate_embedding(request: EmbeddingRequest) -> Result<EmbeddingResponse, String> {
    let client = LLMClient::new(request.api_key.clone(), request.api_endpoint.clone());
    client.generate_embedding(&request).await
}

fn build_rag_context(results: &[VectorSearchResult]) -> String {
    if results.is_empty() {
        return "No relevant context found.".to_string();
    }

    results
        .iter()
        .enumerate()
        .map(|(i, result)| {
            let content = result
                .fields
                .as_ref()
                .and_then(|f| f.get("content"))
                .and_then(|v| v.as_str())
                .unwrap_or("(no content)");

            format!("[Document {}] (score: {:.3})\n{}\n", i + 1, result.score, content)
        })
        .collect::<Vec<_>>()
        .join("\n")
}
