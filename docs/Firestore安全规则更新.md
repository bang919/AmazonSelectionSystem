# Firestore 安全规则更新

## 支持黑名单编辑功能的安全规则

为了支持黑名单编辑功能，需要更新 Firestore 的安全规则以允许写入操作。

### 更新步骤

1. 访问 [Firebase 控制台](https://console.firebase.google.com/)
2. 选择您的项目
3. 在左侧菜单中点击 "Firestore Database"
4. 点击 "规则" 标签页
5. 将现有规则替换为以下内容：

### 推荐的安全规则

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // 允许读取和写入类目黑名单（无需认证）
    match /firestore_collection_category/{document} {
      allow read, write: if true;
    }
    
    // 如果您有其他集合，可以在这里添加相应的规则
    // 例如：
    // match /some_collection/{userId}/{document} {
    //   allow read, write: if request.auth != null && request.auth.uid == userId;
    // }
  }
}
```

### 安全考虑

由于黑名单管理是内部业务需求，上述规则允许任何人读取和写入类目黑名单。如果您需要更严格的访问控制，可以考虑以下选项：

#### 选项1: 基于认证的访问控制
```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // 需要认证才能读取和写入类目黑名单
    match /firestore_collection_category/{document} {
      allow read, write: if request.auth != null;
    }
  }
}
```

#### 选项2: 基于自定义声明的访问控制
```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // 只有管理员才能写入，所有人都可以读取
    match /firestore_collection_category/{document} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
  }
}
```

#### 选项3: 时间和频率限制
```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // 限制写入频率，防止滥用
    match /firestore_collection_category/{document} {
      allow read: if true;
      allow write: if request.time > resource.data.lastModified + duration.value(5, 's');
    }
  }
}
```

### 当前实现的简化规则

考虑到这是内部工具，当前实现使用了最简单的规则：

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // 允许读取和写入类目黑名单（无需认证）
    match /firestore_collection_category/{document} {
      allow read, write: if true;
    }
  }
}
```

这样的规则适合：
- 内部使用的工具
- 不包含敏感信息的数据
- 需要快速部署的场景

### 部署规则

1. 复制上述规则代码
2. 在 Firebase 控制台的 "规则" 页面中粘贴
3. 点击 "发布" 按钮
4. 等待规则部署完成

### 验证规则

部署完成后，可以通过以下方式验证规则是否生效：
1. 在应用中点击 "编辑黑名单" 按钮
2. 尝试切换某个类目的黑名单状态
3. 检查是否能够成功更新

如果遇到权限错误，请检查：
- 规则是否已正确部署
- 网络连接是否正常
- Firebase 配置是否正确

## 注意事项

- 更新规则后通常需要几分钟时间才能在全球范围内生效
- 建议在测试环境中先验证规则的正确性
- 定期检查和更新安全规则以适应业务需求的变化 