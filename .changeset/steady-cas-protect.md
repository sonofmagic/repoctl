---
"@icebreakers/monorepo": patch
"repoctl": patch
---

发布 npm provenance 时遇到瞬时签名服务错误会自动按未发布包重试，并在包已上传但客户端未收到响应时继续完成发布流程。
