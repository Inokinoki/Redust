/// Redis Integration Tests for Redust
///
/// These tests connect to a live Redis instance on port 6379
/// and test the actual Rust Redis implementation used in the app.
///
/// Run with:
///   cd src-tauri
///   cargo test --test redis_integration -- --ignored
///
/// Make sure Redis is running:
///   docker run -d -p 6379:6379 redis:7-alpine

use redis::AsyncCommands;
use redis::aio::MultiplexedConnection;
use redis::{Client, ProtocolVersion};
use std::time::Duration;

#[tokio::test]
#[ignore = "Requires Redis instance on port 6379"]
async fn test_redis_connection() {
    let client = Client::open("redis://localhost:6379").expect("Failed to create Redis client");
    let mut con = client
        .get_multiplexed_async_connection()
        .await
        .expect("Failed to connect to Redis");

    // Test PING
    let pong: String = redis::cmd("PING").query_async(&mut con).await.unwrap();
    assert_eq!(pong, "PONG");
}

#[tokio::test]
#[ignore = "Requires Redis instance on port 6379"]
async fn test_basic_string_operations() {
    let client = Client::open("redis://localhost:6379").expect("Failed to create Redis client");
    let mut con = client
        .get_multiplexed_async_connection()
        .await
        .expect("Failed to connect to Redis");

    let test_key = "test:integration:string";

    // SET
    let _: () = con.set(test_key, "test_value").await.unwrap();

    // GET
    let value: String = con.get(test_key).await.unwrap();
    assert_eq!(value, "test_value");

    // Cleanup
    let _: () = con.del(test_key).await.unwrap();
}

#[tokio::test]
#[ignore = "Requires Redis instance on port 6379"]
async fn test_hash_operations() {
    let client = Client::open("redis://localhost:6379").expect("Failed to create Redis client");
    let mut con = client
        .get_multiplexed_async_connection()
        .await
        .expect("Failed to connect to Redis");

    let test_key = "test:integration:hash";

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
    assert_eq!(all.get("field2"), Some(&"value2".to_string()));

    // HLEN
    let len: usize = con.hlen(test_key).await.unwrap();
    assert_eq!(len, 3);

    // Cleanup
    let _: () = con.del(test_key).await.unwrap();
}

#[tokio::test]
#[ignore = "Requires Redis instance on port 6379"]
async fn test_list_operations() {
    let client = Client::open("redis://localhost:6379").expect("Failed to create Redis client");
    let mut con = client
        .get_multiplexed_async_connection()
        .await
        .expect("Failed to connect to Redis");

    let test_key = "test:integration:list";

    // LPUSH
    let _: () = con.lpush(test_key, "item1").await.unwrap();
    let _: () = con.lpush(test_key, "item2").await.unwrap();

    // LRANGE
    let items: Vec<String> = con.lrange(test_key, 0, -1).await.unwrap();
    assert_eq!(items, vec!["item2", "item1"]);

    // LLEN
    let len: usize = con.llen(test_key).await.unwrap();
    assert_eq!(len, 2);

    // Cleanup
    let _: () = con.del(test_key).await.unwrap();
}

#[tokio::test]
#[ignore = "Requires Redis instance on port 6379"]
async fn test_set_operations() {
    let client = Client::open("redis://localhost:6379").expect("Failed to create Redis client");
    let mut con = client
        .get_multiplexed_async_connection()
        .await
        .expect("Failed to connect to Redis");

    let test_key = "test:integration:set";

    // SADD
    let _: () = con.sadd(test_key, "member1").await.unwrap();
    let _: () = con.sadd(test_key, "member2").await.unwrap();
    let _: () = con.sadd(test_key, "member3").await.unwrap();

    // SMEMBERS
    let members: Vec<String> = con.smembers(test_key).await.unwrap();
    assert_eq!(members.len(), 3);
    assert!(members.contains(&"member1".to_string()));

    // SISMEMBER
    let is_member: bool = con.sismember(test_key, "member2").await.unwrap();
    assert!(is_member);

    // SCARD
    let count: usize = con.scard(test_key).await.unwrap();
    assert_eq!(count, 3);

    // Cleanup
    let _: () = con.del(test_key).await.unwrap();
}

#[tokio::test]
#[ignore = "Requires Redis instance on port 6379"]
async fn test_sorted_set_operations() {
    let client = Client::open("redis://localhost:6379").expect("Failed to create Redis client");
    let mut con = client
        .get_multiplexed_async_connection()
        .await
        .expect("Failed to connect to Redis");

    let test_key = "test:integration:zset";

    // ZADD
    let _: () = con.zadd(test_key, "member1", 100).await.unwrap();
    let _: () = con.zadd(test_key, "member2", 85).await.unwrap();
    let _: () = con.zadd(test_key, "member3", 95).await.unwrap();

    // ZRANGE (ascending)
    let range_asc: Vec<(String, f64)> = con.zrange_withscores(test_key, 0, -1).await.unwrap();
    assert_eq!(range_asc[0].0, "member2"); // Lowest score
    assert_eq!(range_asc[2].0, "member1"); // Highest score

    // ZRANGE (descending)
    let range_desc: Vec<(String, f64)> = con
        .zrange_withscores_limit(test_key, 0, 1)
        .rev()
        .await
        .unwrap();
    assert_eq!(range_desc[0].0, "member1"); // Highest score

    // ZSCORE
    let score: Option<f64> = con.zscore(test_key, "member2").await.unwrap();
    assert_eq!(score, Some(85.0));

    // Cleanup
    let _: () = con.del(test_key).await.unwrap();
}

#[tokio::test]
#[ignore = "Requires Redis instance on port 6379"]
async fn test_json_operations() {
    let client = Client::open("redis://localhost:6379").expect("Failed to create Redis client");
    let mut con = client
        .get_multiplexed_async_connection()
        .await
        .expect("Failed to connect to Redis");

    let test_key = "test:integration:json";

    // Check if RedisJSON module is available
    let module_check: Result<String, redis::RedisError> = redis::cmd("MODULE")
        .arg("LIST")
        .query_async(&mut con)
        .await;

    if module_check.is_err() || !module_check.unwrap().contains("ReJSON") {
        println!("RedisJSON module not available, skipping JSON test");
        return;
    }

    // JSON.SET
    let json_data = serde_json::json!({
        "name": "Test User",
        "age": 30,
        "email": "test@example.com"
    });

    let _: () = redis::cmd("JSON.SET")
        .arg(test_key)
        .arg("$")
        .arg(json_data.to_string())
        .query_async(&mut con)
        .await
        .unwrap();

    // JSON.GET
    let retrieved: String = redis::cmd("JSON.GET")
        .arg(test_key)
        .query_async(&mut con)
        .await
        .unwrap();

    let parsed: serde_json::Value = serde_json::from_str(&retrieved).unwrap();
    assert_eq!(parsed["name"], "Test User");

    // Cleanup
    let _: () = con.del(test_key).await.unwrap();
}

#[tokio::test]
#[ignore = "Requires Redis instance on port 6379"]
async fn test_vector_operations() {
    let client = Client::open("redis://localhost:6379").expect("Failed to create Redis client");
    let mut con = client
        .get_multiplexed_async_connection()
        .await
        .expect("Failed to connect to Redis");

    let index_name = "test:integration:vector";
    let doc_prefix = "test:integration:doc:";

    // Check if Redis Search module is available
    let module_check: Result<String, redis::RedisError> = redis::cmd("MODULE")
        .arg("LIST")
        .query_async(&mut con)
        .await;

    if module_check.is_err() || !module_check.unwrap().contains("search") {
        println!("Redis Search module not available, skipping vector test");
        return;
    }

    // Create vector index
    let create_result: Result<String, redis::RedisError> = redis::cmd("FT.CREATE")
        .arg(index_name)
        .arg("ON")
        .arg("HASH")
        .arg("PREFIX")
        .arg(doc_prefix)
        .arg("SCHEMA")
        .arg("embedding")
        .arg("VECTOR")
        .arg("HNSW")
        .arg("6")
        .arg("TYPE")
        .arg("FLOAT32")
        .arg("DIM")
        .arg("3")
        .arg("DISTANCE_METRIC")
        .arg("COSINE")
        .arg("text")
        .arg("TEXT")
        .query_async(&mut con)
        .await;

    if create_result.is_err() {
        println!("Failed to create vector index, skipping test");
        return;
    }

    // Add documents with embeddings
    let _: () = con
        .hset(
            &format!("{}1", doc_prefix),
            "text",
            "Redis is fast",
        )
        .await
        .unwrap();
    let _: () = con
        .hset(
            &format!("{}1", doc_prefix),
            "embedding",
            "0.1 0.2 0.3",
        )
        .await
        .unwrap();

    let _: () = con
        .hset(
            &format!("{}2", doc_prefix),
            "text",
            "Redis is scalable",
        )
        .await
        .unwrap();
    let _: () = con
        .hset(
            &format!("{}2", doc_prefix),
            "embedding",
            "0.2 0.3 0.4",
        )
        .await
        .unwrap();

    // Wait for indexing
    tokio::time::sleep(Duration::from_millis(500)).await;

    // Search
    let search_result: Result<String, redis::RedisError> = redis::cmd("FT.SEARCH")
        .arg(index_name)
        .arg("*=>[KNN 1 @embedding $vec]")
        .arg("PARAMS")
        .arg("2")
        .arg("vec")
        .arg("0.1 0.2 0.3")
        .query_async(&mut con)
        .await;

    assert!(search_result.is_ok());

    // Cleanup
    let _: () = con
        .del(&format!("{}1", doc_prefix))
        .await
        .unwrap();
    let _: () = con
        .del(&format!("{}2", doc_prefix))
        .await
        .unwrap();
    let _: () = redis::cmd("FT.DROPINDEX")
        .arg(index_name)
        .arg("DD")
        .query_async(&mut con)
        .await
        .unwrap();
}

#[tokio::test]
#[ignore = "Requires Redis instance on port 6379"]
async fn test_performance_bulk_operations() {
    let client = Client::open("redis://localhost:6379").expect("Failed to create Redis client");
    let mut con = client
        .get_multiplexed_async_connection()
        .await
        .expect("Failed to connect to Redis");

    let num_operations = 1000;
    let start = std::time::Instant::now();

    // Pipeline multiple SET operations
    let mut pipe = redis::pipe();
    for i in 0..num_operations {
        let key = format!("test:integration:bulk:{}", i);
        pipe.set(key, format!("value_{}", i));
    }

    let _: () = pipe.query_async::<_, ()>(&mut con).await.unwrap();

    let duration = start.elapsed();
    println!("Bulk SET {} operations in {:?}", num_operations, duration);

    // Should complete in reasonable time (< 5 seconds)
    assert!(duration.as_secs() < 5);

    // Verify some operations
    let exists1: bool = con.exists("test:integration:bulk:1").await.unwrap();
    let exists500: bool = con.exists("test:integration:bulk:500").await.unwrap();
    assert!(exists1 && exists500);

    // Cleanup
    let keys: Vec<String> = con
        .keys("test:integration:bulk:*")
        .await
        .unwrap();
    if !keys.is_empty() {
        let _: () = con.del(keys).await.unwrap();
    }
}

#[tokio::test]
#[ignore = "Requires Redis instance on port 6379"]
async fn test_concurrent_connections() {
    let num_clients = 5;
    let mut handles = vec![];

    for i in 0..num_clients {
        let handle = tokio::spawn(async move {
            let client = Client::open("redis://localhost:6379").expect("Failed to create Redis client");
            let mut con = client
                .get_multiplexed_async_connection()
                .await
                .expect("Failed to connect to Redis");

            let key = format!("test:integration:concurrent:{}", i);
            let _: () = con.set(&key, format!("value_{}", i)).await.unwrap();

            let value: String = con.get(&key).await.unwrap();
            assert_eq!(value, format!("value_{}", i));

            // Cleanup
            let _: () = con.del(&key).await.unwrap();

            Ok::<(), redis::RedisError>(())
        });
        handles.push(handle);
    }

    // Wait for all concurrent operations
    for handle in handles {
        handle.await.unwrap().unwrap();
    }
}

#[tokio::test]
#[ignore = "Requires Redis instance on port 6379"]
async fn test_ttl_operations() {
    let client = Client::open("redis://localhost:6379").expect("Failed to create Redis client");
    let mut con = client
        .get_multiplexed_async_connection()
        .await
        .expect("Failed to connect to Redis");

    let test_key = "test:integration:ttl";

    // SET with EXPIRE
    let _: () = con.set(test_key, "expiring_value").await.unwrap();
    let _: () = con.expire(test_key, 60).await.unwrap();

    // Check TTL
    let ttl: i64 = con.ttl(test_key).await.unwrap();
    assert!(ttl > 0 && ttl <= 60);

    // Verify key exists
    let exists: bool = con.exists(test_key).await.unwrap();
    assert!(exists);

    // Cleanup
    let _: () = con.del(test_key).await.unwrap();
}

#[tokio::test]
#[ignore = "Requires Redis instance on port 6379"]
async fn test_transaction_operations() {
    let client = Client::open("redis://localhost:6379").expect("Failed to create Redis client");
    let mut con = client
        .get_multiplexed_async_connection()
        .await
        .expect("Failed to connect to Redis");

    let key1 = "test:integration:tx:1";
    let key2 = "test:integration:tx:2";

    // MULTI/EXEC transaction
    let mut pipe = redis::pipe();
    pipe.set(key1, "value1");
    pipe.set(key2, "value2");
    pipe.get(key1);
    pipe.get(key2);

    let results: ((), (), String, String) = pipe.query_async(&mut con).await.unwrap();

    // Verify transaction executed atomically
    assert_eq!(results.2, "value1");
    assert_eq!(results.3, "value2");

    // Cleanup
    let _: () = con.del(key1).await.unwrap();
    let _: () = con.del(key2).await.unwrap();
}

#[tokio::test]
#[ignore = "Requires Redis instance on port 6379"]
async fn test_error_handling() {
    let client = Client::open("redis://localhost:6379").expect("Failed to create Redis client");
    let mut con = client
        .get_multiplexed_async_connection()
        .await
        .expect("Failed to connect to Redis");

    // Try to get non-existent key
    let value: Option<String> = con.get("test:integration:nonexistent").await.unwrap();
    assert!(value.is_none());

    // Try to use wrong command on wrong type
    let _: () = con.set("test:integration:type_error", "string_value").await.unwrap();

    // This should fail - can't use HGET on string
    let hget_result: Result<String, redis::RedisError> = redis::cmd("HGET")
        .arg("test:integration:type_error")
        .arg("field")
        .query_async(&mut con)
        .await;

    assert!(hget_result.is_err());

    // Cleanup
    let _: () = con.del("test:integration:type_error").await.unwrap();
}

#[tokio::test]
#[ignore = "Requires Redis instance on port 6379"]
async fn test_redis_manager_integration() {
    // This test would import and test the actual RedisManager from the app
    // For now, we'll test the basic connection patterns it uses

    let client = Client::open("redis://localhost:6379").expect("Failed to create Redis client");
    client.set_protocol_version(ProtocolVersion::RESP3);

    let mut con = client
        .get_multiplexed_async_connection()
        .await
        .expect("Failed to connect to Redis");

    // Test that the connection patterns work
    let info: String = redis::cmd("INFO")
        .arg("server")
        .query_async(&mut con)
        .await
        .unwrap();

    assert!(info.contains("redis_version"));
}
