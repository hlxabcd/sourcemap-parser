# API 文档

## 获取所有 .map 文件列表

- **URL:** `/sourcemaps`
- **方法:** `GET`
- **查询参数:** `version` (可选)
- **描述:** 获取所有 `.map` 文件的列表，按文件创建时间倒序排列。
- **响应:** JSON 数组，包含满足条件的 `.map` 文件路径。

---

## 解析 stacktrace

- **URL:** `/parse`
- **方法:** `POST`
- **请求体:** JSON 对象，包含 `mapFile` 和 `stacktrace`
    - `mapFile`: Sourcemap 文件路径
    - `stacktrace`: 错误堆栈信息
- **描述:** 解析给定 `mapFile` 和 `stacktrace`，返回解析后的堆栈信息。
- **响应:** JSON 对象，包含解析后的 `parsedStacktrace`

---

## 上传 ZIP 文件并解压

- **URL:** `/upload-zip`
- **方法:** `POST`
- **请求体:** `multipart/form-data` 格式，包含 `zipFile` 文件
- **描述:** 上传 ZIP 文件并解压，将解压后的内容保存到 `sourcemaps` 目录中。
- **响应:** 成功消息或失败错误