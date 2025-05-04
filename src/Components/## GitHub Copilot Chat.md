## GitHub Copilot Chat

- Extension Version: 0.26.7 (prod)
- VS Code: vscode/1.99.3
- OS: Linux

## Network

User Settings:
```json
  "github.copilot.advanced.debug.useElectronFetcher": true,
  "github.copilot.advanced.debug.useNodeFetcher": false,
  "github.copilot.advanced.debug.useNodeFetchFetcher": true
```

Connecting to https://api.github.com:
- DNS ipv4 Lookup: 20.87.245.6 (25 ms)
- DNS ipv6 Lookup: Error (42 ms): getaddrinfo ENOTFOUND api.github.com
- Proxy URL: None (2 ms)
- Electron fetch (configured): HTTP 200 (677 ms)
- Node.js https: HTTP 200 (3284 ms)
- Node.js fetch: HTTP 200 (1527 ms)
- Helix fetch: HTTP 200 (1219 ms)

Connecting to https://api.individual.githubcopilot.com/_ping:
- DNS ipv4 Lookup: 140.82.112.22 (2 ms)
- DNS ipv6 Lookup: Error (17 ms): getaddrinfo ENOTFOUND api.individual.githubcopilot.com
- Proxy URL: None (55 ms)
- Electron fetch (configured): HTTP 200 (1043 ms)
- Node.js https: HTTP 200 (3640 ms)
- Node.js fetch: HTTP 200 (1545 ms)
- Helix fetch: HTTP 200 (1255 ms)

## Documentation

In corporate networks: [Troubleshooting firewall settings for GitHub Copilot](https://docs.github.com/en/copilot/troubleshooting-github-copilot/troubleshooting-firewall-settings-for-github-copilot).