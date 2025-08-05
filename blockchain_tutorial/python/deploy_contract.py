#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
智能合约部署脚本
用于部署SettlementToken合约到Ganache本地链
"""

import json
import os
from web3 import Web3
from eth_account import Account
from blockchain_client import BlockchainClient

def deploy_contract():
    """部署智能合约"""
    
    # 连接到Ganache
    ganache_url = "http://127.0.0.1:7545"
    w3 = Web3(Web3.HTTPProvider(ganache_url))
    
    if not w3.is_connected():
        print("❌ 无法连接到Ganache，请确保Ganache正在运行")
        return None
    
    print("✅ 成功连接到Ganache")
    
    # 获取部署账户
    accounts = w3.eth.accounts
    if not accounts:
        print("❌ 没有可用的账户")
        return None
    
    deployer_account = accounts[0]
    print(f"部署账户: {deployer_account}")
    
    # 读取合约字节码和ABI
    # 注意：这里需要先编译合约
    contract_path = "../contracts/SettlementToken.sol"
    
    # 这里应该使用编译后的字节码和ABI
    # 为了演示，我们使用一个简化的示例
    print("⚠️  注意：这里需要先编译Solidity合约")
    print("请使用以下命令编译合约：")
    print("solc --bin --abi contracts/SettlementToken.sol -o build/")
    
    # 示例合约信息（实际使用时需要替换为编译后的数据）
    contract_bytecode = "0x..."  # 编译后的字节码
    contract_abi = []  # 编译后的ABI
    
    # 构建部署交易
    contract = w3.eth.contract(abi=contract_abi, bytecode=contract_bytecode)
    
    # 合约构造函数参数
    constructor_args = ["Settlement Token", "SETT"]
    
    # 构建交易
    transaction = contract.constructor(*constructor_args).build_transaction({
        'from': deployer_account,
        'gas': 2000000,
        'gasPrice': w3.eth.gas_price,
        'nonce': w3.eth.get_transaction_count(deployer_account)
    })
    
    # 签名交易
    signed_txn = w3.eth.account.sign_transaction(transaction, private_key="0x" + "0" * 64)
    
    # 发送交易
    tx_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)
    print(f"✅ 部署交易已发送: {tx_hash.hex()}")
    
    # 等待交易确认
    tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    
    if tx_receipt.status == 1:
        contract_address = tx_receipt.contractAddress
        print(f"✅ 合约部署成功！地址: {contract_address}")
        
        # 保存合约信息
        contract_info = {
            'address': contract_address,
            'abi': contract_abi,
            'deployer': deployer_account,
            'transaction_hash': tx_hash.hex(),
            'block_number': tx_receipt.blockNumber
        }
        
        with open('contract_info.json', 'w') as f:
            json.dump(contract_info, f, indent=2)
        
        print("✅ 合约信息已保存到 contract_info.json")
        return contract_address
    else:
        print("❌ 合约部署失败")
        return None

def compile_contract():
    """编译智能合约（需要安装solc编译器）"""
    
    print("编译智能合约...")
    
    # 检查solc是否安装
    if os.system("solc --version") != 0:
        print("❌ 未找到solc编译器")
        print("请安装Solidity编译器：")
        print("Ubuntu/Debian: sudo apt-get install solc")
        print("macOS: brew install solidity")
        print("Windows: 下载并安装solc-windows.exe")
        return False
    
    # 创建build目录
    os.makedirs("build", exist_ok=True)
    
    # 编译合约
    contract_path = "../contracts/SettlementToken.sol"
    output_dir = "build"
    
    cmd = f"solc --bin --abi {contract_path} -o {output_dir} --overwrite"
    
    if os.system(cmd) == 0:
        print("✅ 合约编译成功")
        return True
    else:
        print("❌ 合约编译失败")
        return False

def main():
    """主函数"""
    
    print("🚀 智能合约部署工具")
    print("=" * 50)
    
    # 1. 编译合约
    if not compile_contract():
        return
    
    # 2. 部署合约
    contract_address = deploy_contract()
    
    if contract_address:
        print("\n🎉 部署完成！")
        print(f"合约地址: {contract_address}")
        print("\n接下来可以：")
        print("1. 使用 blockchain_client.py 与合约交互")
        print("2. 查看 contract_info.json 获取合约信息")
        print("3. 在Ganache中查看交易记录")

if __name__ == "__main__":
    main() 