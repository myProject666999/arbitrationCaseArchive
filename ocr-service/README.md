# OCR模拟服务

一个用于模拟OCR识别功能的独立HTTP服务，适用于开发和测试环境。

## 功能特性

- 模拟OCR识别过程，支持文件上传
- 根据文件名智能匹配不同的仲裁文档模板
- 支持5种以上仲裁文档类型（仲裁申请书、答辩书、证据清单、仲裁裁决书、借款合同等）
- 随机1-3秒延迟模拟真实处理时间
- 返回置信度评分、处理时间等元数据
- 健康检查接口
- CORS跨域支持

## 快速开始

### 安装依赖

```bash
cd ocr-service
npm install
```

### 启动服务

```bash
npm start
```

服务将在 `http://localhost:3001` 启动。

## API接口

### 1. 健康检查

**GET** `/health`

检查服务运行状态。

响应示例：
```json
{
  "status": "ok",
  "service": "ocr-simulator",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "uptime": 123.45
}
```

### 2. OCR识别

**POST** `/ocr`

接收文件上传，返回模拟的OCR识别结果。

请求参数：
- `file`: 上传的文件（multipart/form-data）

响应示例：
```json
{
  "success": true,
  "text": "仲裁申请书\n申请人：张三...",
  "confidence": 95.5,
  "engine": "Tesseract-Simulator",
  "processingTime": 1234
}
```

## 文档模板匹配规则

服务根据上传文件的文件名自动匹配对应的文档模板：

| 文件名包含关键词 | 匹配模板 |
|---------------|---------|
| 仲裁申请、申请书 | 仲裁申请书 |
| 答辩、答辩状 | 答辩书 |
| 证据、证据清单 | 证据清单 |
| 裁决、裁决书、仲裁裁决 | 仲裁裁决书 |
| 借款、合同 | 借款合同 |
| 其他 | 随机匹配或默认模板 |

## 配置说明

- 服务端口：3001
- 模拟延迟：1000-3000ms
- 置信度范围：85-100%
- OCR引擎：Tesseract-Simulator

## 目录结构

```
ocr-service/
├── package.json    # 项目配置
├── index.js        # 主服务文件
└── README.md       # 说明文档
```
