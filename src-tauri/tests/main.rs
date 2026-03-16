/// Redis Integration Tests Runner
///
/// Run with: cd src-tauri/tests && cargo test -- --ignored

mod redis_tests;

fn main() {
    println!("🦀 Rust Redis Integration Tests for Redust");
    println!("================================");
    println!();
    println!("Run tests with:");
    println!("  cd src-tauri/tests && cargo test -- --ignored");
    println!();
    println!("Make sure Redis is running on port 6379:");
    println!("  docker run -d -p 6379:6379 redis:7-alpine");
    println!();
}
