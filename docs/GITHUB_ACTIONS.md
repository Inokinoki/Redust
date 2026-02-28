# GitHub Actions Setup for Cross-Platform Builds

This document explains how to set up GitHub Actions to build Redust for multiple platforms.

## Supported Platforms

The GitHub Actions workflow builds Redust for:

- **macOS ARM64** (Apple Silicon - M1/M2/M3)
- **macOS Intel** (x86_64)
- **Windows ARM64** (Surface Pro X, etc.)
- **Windows x64** (Standard Windows)
- **Linux** (AppImage format)

## Required GitHub Secrets

You need to set up the following secrets in your GitHub repository:

### 1. TAURI_PRIVATE_KEY

Generate a key pair for Tauri code signing:

```bash
npm run tauri signer generate
```

This creates two files:

- `private-key` - Add this as `TAURI_PRIVATE_KEY` secret
- `public-key` - Add this to `src-tauri/tauri.conf.json`

### 2. TAURI_KEY_PASSWORD

Set a password for the private key:

- Add any secure password as `TAURI_KEY_PASSWORD` secret

### How to Add Secrets

1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add `TAURI_PRIVATE_KEY` with the contents of `private-key`
5. Add `TAURI_KEY_PASSWORD` with your chosen password
6. Click **Add secret**

## Triggering Builds

### Automatic Builds

Builds are automatically triggered when you push a version tag:

```bash
git tag v1.0.0
git push origin v1.0.0
```

### Manual Builds

You can manually trigger a build from the Actions tab:

1. Go to **Actions** tab in your repository
2. Select **Build and Release** workflow
3. Click **Run workflow**
4. Select the branch to build from

## Build Artifacts

After a successful build, artifacts are available from:

1. Go to the workflow run
2. Scroll to **Artifacts** section
3. Download the desired platform's bundle

### Artifact Names

- `macos-arm64` - Apple Silicon DMG and .app
- `macos-intel` - Intel DMG and .app
- `windows-arm64` - ARM64 installer
- `windows-x64` - x64 installer
- `linux-appimage` - Linux AppImage

## Releases

When you push a version tag (e.g., `v1.0.0`):

1. All platforms build in parallel
2. A GitHub Release is automatically created
3. All artifacts are attached to the release

## Local Building

If you prefer to build locally instead of downloading artifacts:

### macOS ARM64 (Apple Silicon)

```bash
# Install Rust (if needed)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# Install Rust target for Apple Silicon
rustup target add aarch64-apple-darwin

# Build
cargo build --release --target aarch64-apple-darwin
# Or use Tauri
npm run tauri build --target aarch64-apple-darwin
```

### macOS Intel

```bash
# Install Rust target for Intel
rustup target add x86_64-apple-darwin

# Build
npm run tauri build --target x86_64-apple-darwin
```

### Windows ARM64

```bash
# Install Rust toolchain for Windows
# Run in PowerShell or WSL
rustup target add aarch64-pc-windows-msvc

# Build
npm run tauri build --target aarch64-pc-windows-msvc
```

### Windows x64

```bash
# Build (default target)
npm run tauri build
```

## Troubleshooting

### macOS Builds

If you encounter code signing errors:

1. Ensure your Apple Developer certificate is valid
2. Update `src-tauri/tauri.conf.json` with correct team ID
3. Regenerate the key pair with `npm run tauri signer generate`

### Windows Builds

If builds fail:

1. Check that MSVC is properly installed (Visual Studio Build Tools)
2. Ensure GitHub Actions has access to the Windows runner

### Linux Builds

Linux builds use system libraries that may need updates:

- libwebkit2gtk-4.0-dev
- libssl-dev
- libgtk-3-dev
- libayatana-appindicator3-dev
- librsvg2-dev

## CI/CD Best Practices

1. **Tag releases properly**: Use semantic versioning (v1.0.0, v1.0.1, v1.1.0)
2. **Test before release**: Use manual workflow run to test a build
3. **Keep secrets updated**: Rotate signing keys periodically
4. **Monitor build times**: If builds get too slow, check caching strategy

## Support

For issues with GitHub Actions builds:

1. Check the Actions tab for detailed logs
2. Verify all secrets are set correctly
3. Check that Tauri version in `Cargo.toml` matches installed tools
4. Report issues with platform, OS version, and build logs
