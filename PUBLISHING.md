# Publishing to npm

## Pre-publish checklist

1. **Update package.json version**:
   ```bash
   npm version patch  # or minor/major
   ```

2. **Test installation locally**:
```bash
npm pack
npm install -g ./tinykode-gen-1.0.0.tgz
gen --help
```3. **Publish to npm**:
   ```bash
   npm login
   npm publish
   ```

## Publishing commands

```bash
# Patch version (1.0.0 → 1.0.1)
npm version patch && npm publish

# Minor version (1.0.0 → 1.1.0)  
npm version minor && npm publish

# Major version (1.0.0 → 2.0.0)
npm version major && npm publish
```

## Testing global installation

```bash
# After publishing
npm install -g @tinykode/gen

# Test
gen --help
gen provider -list
gen -m "test command"
```