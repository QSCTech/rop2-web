# rop2-web
求是潮rop项目的迭代。

### 开发指南
- `git clone`本仓库（可选参数`--depth 1`浅克隆）
- `npm i`安装依赖
- `npm start`开启开发服务器

### 技术栈
- vite 用于热重载、构建生产版本。
- typescript 提供编译时强类型语法检查。
- react 渲染框架。
- sass css的超集。因使用了UI框架，手写样式的频率不应过高。
- react-router-dom 路由框架，构建SPA。
- antd 蚂蚁集团推出的UI框架。

### 注意事项
- 由于嵌套层级较高，推荐tabSize为2。
- 修改某些文件时，vite将进行热重载(将忽略部分模块导入)。此时导航至其它页面，可能因原型拓展方法丢失导致报错白屏。该问题理论上不会在生产版本出现。

### 部署
运行编译脚本前，先将环境变量VITE_APIBASE设为完整的API基路径且不以/结尾，如`http://127.0.0.1:8080`
```sh
npm run build -- --base=/rop
```
将dist文件夹下所有文件使用scp或sftp上传到服务器，并正确修改nginx配置