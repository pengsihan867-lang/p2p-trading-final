# 区块链开发环境设置指南

## 1. 安装必要工具

### 1.1 安装 Node.js 和 npm
```bash
# 下载并安装 Node.js (包含 npm)
# 访问 https://nodejs.org/ 下载最新版本

# 验证安装
node --version
npm --version
```

### 1.2 安装 Ganache
```bash
# 方法1: 使用 npm 安装
npm install -g ganache-cli

# 方法2: 下载桌面版
# 访问 https://trufflesuite.com/ganache/ 下载
```

### 1.3 安装 Solidity 编译器
```bash
# Ubuntu/Debian
sudo apt-get install solc

# macOS
brew install solidity

# Windows
# 下载 solc-windows.exe 并添加到 PATH

# 验证安装
solc --version
```

### 1.4 安装 Python 依赖
```bash
cd blockchain_tutorial/python
pip install -r requirements.txt
```

## 2. 启动开发环境

### 2.1 启动 Ganache
```bash
# 使用命令行版本
ganache-cli --port 7545 --network-id 1337

# 或使用桌面版
# 打开 Ganache 应用，配置端口为 7545
```

### 2.2 验证连接
```bash
# 测试连接
curl -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  http://127.0.0.1:7545
```

## 3. 编译和部署智能合约

### 3.1 编译合约
```bash
cd blockchain_tutorial
solc --bin --abi contracts/SettlementToken.sol -o python/build/ --overwrite
```

### 3.2 部署合约
```bash
cd python
python deploy_contract.py
```

## 4. 与合约交互

### 4.1 基本交互
```bash
python blockchain_client.py
```

### 4.2 自定义交互
```python
from blockchain_client import BlockchainClient

# 创建客户端
client = BlockchainClient()

# 加载账户
client.load_account()

# 加载合约
client.load_contract("合约地址", "ABI文件路径")

# 转账
tx_hash = client.transfer_tokens("接收方地址", 1000, "测试转账")

# 查询余额
balance = client.get_token_balance()
print(f"余额: {balance}")
```

## 5. 常见问题解决

### 5.1 Ganache 连接失败
- 检查 Ganache 是否正在运行
- 确认端口号是否正确 (7545)
- 检查防火墙设置

### 5.2 合约编译失败
- 确认 Solidity 版本兼容性
- 检查合约语法错误
- 确认 OpenZeppelin 依赖

### 5.3 交易失败
- 检查账户余额是否足够
- 确认 Gas 限制设置
- 检查合约地址是否正确

## 6. 开发工具推荐

### 6.1 IDE 和编辑器
- **VS Code**: 安装 Solidity 扩展
- **Remix**: 在线 Solidity IDE
- **Truffle**: 开发框架

### 6.2 调试工具
- **Ganache**: 本地区块链
- **MetaMask**: 浏览器钱包
- **Etherscan**: 区块浏览器

## 7. 学习资源

### 7.1 官方文档
- [Solidity 文档](https://docs.soliditylang.org/)
- [Web3.py 文档](https://web3py.readthedocs.io/)
- [OpenZeppelin 文档](https://docs.openzeppelin.com/)

### 7.2 教程和课程
- [CryptoZombies](https://cryptozombies.io/)
- [Ethereum.org 教程](https://ethereum.org/developers/tutorials/)
- [OpenZeppelin 教程](https://docs.openzeppelin.com/learn/)

## 8. 安全注意事项

### 8.1 私钥安全
- 永远不要分享私钥
- 使用环境变量存储私钥
- 定期备份钱包

### 8.2 合约安全
- 进行代码审计
- 使用经过验证的库
- 测试所有功能

### 8.3 网络安全
- 使用 HTTPS 连接
- 验证合约地址
- 检查交易详情 