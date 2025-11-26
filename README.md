# Strava Wheel

一个纯前端的 Strava 小工具：完成 OAuth 登录后拉取最近 20 条活动，用自定义的 OpenAI 模型生成一句毒舌但幽默的中文锐评，并一键写回活动描述。

## 功能
- 前端直接发起 Strava OAuth，支持刷新 access token，凭证和 token 都存浏览器。
- 查看最近 20 条活动，展示距离、时长、运动类型和时间。
- 配置 OpenAI（model / baseUrl / apiKey / system prompt），生成一句不超过 40 字的锐评。
- 一键把锐评追加到 Strava 活动描述，失败与成功都有提示。
- 亮色/暗色切换与 Three.js Shader 动效的首页背景。

## 快速开始
1) 准备 Node.js 18+ 与 pnpm  
2) 安装依赖：`pnpm install`  
3) 直接运行 `pnpm dev`，打开浏览器访问登录页，填写 Strava 凭证与 OpenAI 配置即可使用  
4) 构建产物：`pnpm build`，预览：`pnpm preview`

## 配置方式
- 登录页填写 Strava Client ID / Client Secret，用于 OAuth 登录，token 自动存 localStorage。
- 同页填写 OpenAI 模型、Base URL、API Key、System Prompt，用于生成锐评，配置存 localStorage。  
（无需 `.env`，全部在登录页填写；如要本地预填可自行扩展，但默认不需要。）

## 使用说明
- **登录**：在 `/login` 输入 Strava Client ID/Secret，点击「登录 Strava」后完成授权回调；token 和 athlete 信息会存入 localStorage。  
- **配置 Wheel**：同一页可填写 OpenAI 相关配置（model/baseUrl/apiKey/system prompt），用于生成锐评。  
- **查看活动**：进入 `/activities`，点击「刷新活动」拉取最近 20 条活动。  
- **生成锐评**：对单条活动点击「生成锐评」，调用 OpenAI 输出一句话点评。  
- **发布**：点击「发布到 Strava」将锐评追加到该活动描述。支持「刷新 Token」以延长有效期。

## 开发脚本
- `pnpm dev`：启动开发服务器
- `pnpm build`：类型检查并构建产物
- `pnpm preview`：本地预览构建结果

## 注意事项
- 本项目无后端，所有 Strava 与 OpenAI 请求直接由浏览器发起，请在可信环境中使用。  
- Strava token、athlete 信息与 OpenAI 配置存储在浏览器 localStorage；Client ID/Secret 也会被暂存在 sessionStorage，敏感信息请谨慎分享。  
- 回调地址使用 hash 路由（默认 `/#/login`），确保在 Strava 应用设置中允许该域名。
