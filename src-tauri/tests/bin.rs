/// Redis Integration Tests Runner
///
/// Run with: cargo test --manifest-path tests/Cargo.toml

fn main() {
    println!("🦀 Redis Integration Tests for Redust");
    println!("================================");
    println!();
    println!("Run tests with:");
    println!("  cargo test --manifest-path tests/Cargo.toml");
    println!();
    println!("Make sure Redis is running on port 6379:");
    println!("  docker run -d -p 6379:6379 redis:7-alpine");
}
