# Firebase 配置指南

## 快速配置步骤

### 1. 创建 `.env.local` 文件

在项目根目录创建 `.env.local` 文件（与 `package.json` 同级）：

```env
NEXT_PUBLIC_FIREBASE_API_KEY=你的API密钥
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=你的项目ID.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=你的项目ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=你的项目ID.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=你的发送者ID
NEXT_PUBLIC_FIREBASE_APP_ID=你的应用ID
```

### 2. 获取Firebase配置信息

1. 访问 [Firebase控制台](https://console.firebase.google.com/)
2. 创建新项目或选择现有项目
3. 点击左侧菜单的 "项目设置" （齿轮图标）
4. 在 "常规" 标签下，找到 "您的应用" 部分
5. 点击 "添加应用" → 选择 "网页应用" 图标
6. 输入应用名称，点击注册
7. 在 "Firebase SDK 代码片段" 中选择 "配置"
8. 复制配置对象中的值到 `.env.local` 文件

### 3. 启用 Firestore 数据库

1. 在Firebase控制台中，点击左侧菜单的 "Firestore Database"
2. 点击 "创建数据库"
3. 选择 "以生产模式启动"（或测试模式）
4. 选择数据库位置

### 4. 设置安全规则（重要）

在 "Firestore Database" → "规则" 中，添加以下规则：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /firestore_collection_category/{document} {
      allow read: if true;  // 允许读取类目黑名单
    }
  }
}
```

### 5. 创建类目黑名单集合

1. 在 "Firestore Database" → "数据" 中
2. 点击 "开始收集"
3. 集合ID输入：`firestore_collection_category`
4. 添加文档：
   - 文档ID：格式化后的类目名称（如：`Tablecloths`）
   - 字段：`is_exclude`，类型：`boolean`，值：`true` 或 `false`

### 示例文档结构

```
firestore_collection_category/
├── Tablecloths/
│   └── is_exclude: true
├── KitchenTools/
│   └── is_exclude: false
└── ...
```

## 测试配置

配置完成后，重启开发服务器：

```bash
npm run dev
```

如果配置正确，控制台会显示：`Firebase 初始化成功`

## 注意事项

1. **环境变量安全**：`.env.local` 文件不会被提交到Git，确保不要将敏感信息推送到代码仓库
2. **域名限制**：在生产环境中，建议在Firebase控制台设置授权域名
3. **费用控制**：Firestore有免费额度，超出后会产生费用
4. **数据格式**：小类目名称会自动格式化（去除空格、特殊字符等）

## 常见问题

### Q: 提示"Firebase 配置不完整"
A: 检查 `.env.local` 文件是否存在且所有字段都已填写

### Q: 无法连接到Firestore
A: 检查网络连接和Firebase项目是否已启用Firestore

### Q: 黑名单功能不工作
A: 检查Firestore安全规则是否允许读取操作

## 跳过Firebase配置

如果您暂时不需要黑名单功能，系统会自动跳过Firebase连接，其他功能仍然正常工作。 