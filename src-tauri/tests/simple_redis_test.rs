/// Simple Redis Integration Test
/// Run with: cargo test --manifest-path tests/Cargo.toml

#[tokio::test]
#[ignore = "Requires Redis on port 6379"]
async fn test_redis_ping() {
    let client = redis::Client::open("redis://localhost:6379").unwrap();
    let mut con = client.get_multiplexed_async_connection().await.unwrap();

    let pong: String = redis::cmd("PING").query_async(&mut con).await.unwrap();
    assert_eq!(pong, "PONG");
    println!("✅ Redis PING successful: {}", pong);
}
