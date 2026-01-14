# 测试数据库设置指南

## 1. 创建测试数据库

在 MySQL 中创建测试数据库：

```sql
CREATE DATABASE test_image_evaluation;
CREATE USER 'test'@'localhost' IDENTIFIED BY 'test';
GRANT ALL PRIVILEGES ON test_image_evaluation.* TO 'test'@'localhost';
FLUSH PRIVILEGES;
```

## 2. 配置环境变量

创建 `.env.test` 文件（或使用 `tests/.env.test` 作为模板）：

```env
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=test
DATABASE_PASSWORD=test
DATABASE_NAME=test_image_evaluation
SESSION_SECRET=test-session-secret-key-for-testing-only
CLEANUP_ENABLED=false
STORAGE_TYPE=local
```

## 3. 运行数据库迁移

```bash
# 设置测试环境变量
export DATABASE_NAME=test_image_evaluation
export DATABASE_USER=test
export DATABASE_PASSWORD=test

# 运行迁移
pnpm migrate
```

## 4. 运行集成测试

```bash
# 使用测试环境变量运行测试
DATABASE_NAME=test_image_evaluation DATABASE_USER=test DATABASE_PASSWORD=test pnpm test tests/integration
```

## 5. 使用 Docker 快速设置测试数据库

如果你使用 Docker，可以快速启动一个测试数据库：

```bash
docker run -d \
  --name test-mysql \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=test_image_evaluation \
  -e MYSQL_USER=test \
  -e MYSQL_PASSWORD=test \
  -p 3307:3306 \
  mysql:8.0
```

然后更新 `.env.test` 中的端口为 `3307`。
