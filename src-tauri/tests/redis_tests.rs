/// Rust Redis Integration Tests
/// These test the actual Rust Redis implementation used in the Tauri backend
///
/// Run with: cd src-tauri/tests && cargo test -- --ignored

#[cfg(test)]
mod redis_integration_tests {
    use redis::AsyncCommands;

    #[tokio::test]
    #[ignore = "Requires Redis instance on port 6379"]
    async fn test_redis_connection() {
        let client = redis::Client::open("redis://localhost:6379").expect("Failed to create Redis client");
        let mut con = client
            .get_multiplexed_async_connection()
            .await
            .expect("Failed to connect to Redis");

        // Test PING
        let pong: String = redis::cmd("PING").query_async(&mut con).await.unwrap();
        assert_eq!(pong, "PONG");
        println!("✅ Redis PING successful");
    }

    #[tokio::test]
    #[ignore = "Requires Redis instance on port 6379"]
    async fn test_string_operations() {
        let client = redis::Client::open("redis://localhost:6379").expect("Failed to create Redis client");
        let mut con = client
            .get_multiplexed_async_connection()
            .await
            .expect("Failed to connect to Redis");

        let test_key = "test:integration:rust:string";

        // SET
        let _: () = con.set(test_key, "test_value").await.unwrap();

        // GET
        let value: String = con.get(test_key).await.unwrap();
        assert_eq!(value, "test_value");

        // Cleanup
        let _: () = con.del(test_key).await.unwrap();
        println!("✅ String operations successful");
    }

    #[tokio::test]
    #[ignore = "Requires Redis instance on port 6379"]
    async fn test_hash_operations() {
        let client = redis::Client::open("redis://localhost:6379").expect("Failed to create Redis client");
        let mut con = client
            .get_multiplexed_async_connection()
            .await
            .expect("Failed to connect to Redis");

        let test_key = "test:integration:rust:hash";

        // HSET multiple fields
        let _: () = con
            .hset_multiple(
                test_key,
                &[("field1", "value1"), ("field2", "value2"), ("field3", "value3")],
            )
            .await
            .unwrap();

        // HGET
        let field1: String = con.hget(test_key, "field1").await.unwrap();
        assert_eq!(field1, "value1");

        // HGETALL
        let all: std::collections::HashMap<String, String> = con.hgetall(test_key).await.unwrap();
        assert_eq!(all.len(), 3);

        // Cleanup
        let _: () = con.del(test_key).await.unwrap();
        println!("✅ Hash operations successful");
    }

    #[tokio::test]
    #[ignore = "Requires Redis instance on port 6379"]
    async fn test_performance_bulk_operations() {
        let client = redis::Client::open("redis://localhost:6379").expect("Failed to create Redis client");
        let mut con = client
            .get_multiplexed_async_connection()
            .await
            .expect("Failed to connect to Redis");

        let num_operations = 100;
        let start = std::time::Instant::now();

        // Pipeline multiple SET operations
        let mut pipe = redis::pipe();
        for i in 0..num_operations {
            let key = format!("test:integration:rust:bulk:{}", i);
            pipe.set(&key, format!("value_{}", i));
        }

        let _: () = pipe.query_async::<_, ()>(&mut con).await.unwrap();

        let duration = start.elapsed();
        println!("✅ Bulk SET {} operations in {:?}", num_operations, duration);

        // Should complete in reasonable time (< 2 seconds)
        assert!(duration.as_secs() < 2);

        // Cleanup
        let keys: Vec<String> = con.keys("test:integration:rust:bulk:*").await.unwrap();
        if !keys.is_empty() {
            let _: () = con.del(keys).await.unwrap();
        }
    }
}
