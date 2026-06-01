use anyhow::{anyhow, Result};
use bcrypt::{hash, verify, DEFAULT_COST};
use chrono::{Duration, Utc};
use jsonwebtoken::{decode, encode, Algorithm, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use std::env;

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String, // User ID
    pub exp: usize,
}

pub fn hash_password(password: &str) -> Result<String> {
    hash(password, DEFAULT_COST).map_err(|e| anyhow!("Hashing error: {}", e))
}

pub fn verify_password(password: &str, hashed: &str) -> Result<bool> {
    verify(password, hashed).map_err(|e| anyhow!("Verification error: {}", e))
}

pub fn generate_jwt(user_id: &str) -> Result<String> {
    let secret = env::var("JWT_SECRET").unwrap_or_else(|_| "secret_creatix_key_123".to_string());
    let expiration = Utc::now()
        .checked_add_signed(Duration::days(7))
        .expect("valid timestamp")
        .timestamp();

    let claims = Claims {
        sub: user_id.to_owned(),
        exp: expiration as usize,
    };

    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.as_ref()),
    )
    .map_err(|e| anyhow!("JWT Error: {}", e))
}

pub fn validate_jwt(token: &str) -> Result<Claims> {
    let secret = env::var("JWT_SECRET").unwrap_or_else(|_| "secret_creatix_key_123".to_string());
    let validation = Validation::new(Algorithm::HS256);

    let token_data = decode::<Claims>(
        token,
        &DecodingKey::from_secret(secret.as_ref()),
        &validation,
    )
    .map_err(|e| anyhow!("JWT Validation Error: {}", e))?;

    Ok(token_data.claims)
}
