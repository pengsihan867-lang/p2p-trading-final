#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
区块链客户端使用示例
演示如何使用BlockchainClient进行各种操作
"""

import json
import time
from blockchain_client import BlockchainClient

def demo_basic_operations():
    """演示基本操作"""
    print("🔧 基本操作演示")
    print("=" * 50)
    
    # 创建客户端
    client = BlockchainClient()
    
    # 加载账户
    client.load_account()
    
    # 这里需要替换为实际的合约地址和ABI文件路径
    contract_address = "0x1234567890123456789012345678901234567890"
    abi_path = "contract_info.json"
    
    try:
        # 加载合约
        client.load_contract(contract_address, abi_path)
        
        # 获取合约信息
        info = client.get_contract_info()
        if info:
            print(f"📋 合约信息:")
            print(f"  名称: {info['name']}")
            print(f"  符号: {info['symbol']}")
            print(f"  总供应量: {info['total_supply']}")
            print(f"  交易数量: {info['transaction_count']}")
        
        # 获取余额
        balance = client.get_token_balance()
        print(f"💰 当前余额: {balance}")
        
    except Exception as e:
        print(f"❌ 错误: {e}")
        print("请确保合约已部署并且地址正确")

def demo_transfer_operations():
    """演示转账操作"""
    print("\n💸 转账操作演示")
    print("=" * 50)
    
    client = BlockchainClient()
    client.load_account()
    
    # 示例地址（实际使用时需要替换）
    contract_address = "0x1234567890123456789012345678901234567890"
    abi_path = "contract_info.json"
    
    try:
        client.load_contract(contract_address, abi_path)
        
        # 转账示例
        recipient = "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"
        amount = 1000
        description = "测试转账"
        
        print(f"📤 转账 {amount} 代币到 {recipient}")
        tx_hash = client.transfer_tokens(recipient, amount, description)
        
        # 等待交易确认
        receipt = client.wait_for_transaction(tx_hash)
        if receipt and receipt['status'] == 1:
            print("✅ 转账成功！")
            
            # 查询新余额
            new_balance = client.get_token_balance()
            print(f"💰 新余额: {new_balance}")
        
    except Exception as e:
        print(f"❌ 转账失败: {e}")

def demo_batch_transfer():
    """演示批量转账"""
    print("\n📦 批量转账演示")
    print("=" * 50)
    
    client = BlockchainClient()
    client.load_account()
    
    contract_address = "0x1234567890123456789012345678901234567890"
    abi_path = "contract_info.json"
    
    try:
        client.load_contract(contract_address, abi_path)
        
        # 批量转账示例
        recipients = [
            "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
            "0x8ba1f109551bD432803012645Hac136c772c3c3",
            "0x147B8eb97fD247D06C4006D269c90C1908Fb5D54"
        ]
        
        amounts = [100, 200, 300]
        description = "批量转账测试"
        
        print(f"📤 批量转账到 {len(recipients)} 个地址")
        for i, (recipient, amount) in enumerate(zip(recipients, amounts)):
            print(f"  {i+1}. {recipient}: {amount} 代币")
        
        tx_hash = client.batch_transfer(recipients, amounts, description)
        
        # 等待交易确认
        receipt = client.wait_for_transaction(tx_hash)
        if receipt and receipt['status'] == 1:
            print("✅ 批量转账成功！")
        
    except Exception as e:
        print(f"❌ 批量转账失败: {e}")

def demo_transaction_history():
    """演示交易历史查询"""
    print("\n📜 交易历史演示")
    print("=" * 50)
    
    client = BlockchainClient()
    client.load_account()
    
    contract_address = "0x1234567890123456789012345678901234567890"
    abi_path = "contract_info.json"
    
    try:
        client.load_contract(contract_address, abi_path)
        
        # 获取用户的所有交易
        user_address = client.account.address
        transaction_ids = client.get_user_transactions(user_address)
        
        print(f"📋 {user_address} 的交易记录:")
        print(f"总交易数: {len(transaction_ids)}")
        
        # 显示最近的5笔交易
        for i, tx_id in enumerate(transaction_ids[-5:]):
            tx_record = client.get_transaction_record(tx_id)
            if tx_record:
                print(f"\n交易 #{tx_id}:")
                print(f"  发送方: {tx_record['from']}")
                print(f"  接收方: {tx_record['to']}")
                print(f"  金额: {tx_record['amount']}")
                print(f"  时间: {time.ctime(tx_record['timestamp'])}")
                print(f"  描述: {tx_record['description']}")
        
    except Exception as e:
        print(f"❌ 查询交易历史失败: {e}")

def demo_contract_events():
    """演示合约事件监听"""
    print("\n👂 合约事件演示")
    print("=" * 50)
    
    client = BlockchainClient()
    client.load_account()
    
    contract_address = "0x1234567890123456789012345678901234567890"
    abi_path = "contract_info.json"
    
    try:
        client.load_contract(contract_address, abi_path)
        
        # 获取最新区块
        latest_block = client.w3.eth.block_number
        print(f"当前区块高度: {latest_block}")
        
        # 监听交易记录事件
        print("监听交易记录事件...")
        
        # 获取过去10个区块的事件
        from_block = max(0, latest_block - 10)
        to_block = latest_block
        
        # 这里需要根据实际的ABI来获取事件
        # 示例代码，实际使用时需要调整
        print("事件监听功能需要根据具体合约ABI来实现")
        
    except Exception as e:
        print(f"❌ 事件监听失败: {e}")

def main():
    """主函数"""
    print("🚀 区块链客户端使用示例")
    print("=" * 60)
    
    # 检查是否连接到Ganache
    try:
        client = BlockchainClient()
        print("✅ 成功连接到Ganache")
    except Exception as e:
        print(f"❌ 无法连接到Ganache: {e}")
        print("请确保Ganache正在运行在端口7545")
        return
    
    # 运行演示
    demo_basic_operations()
    demo_transfer_operations()
    demo_batch_transfer()
    demo_transaction_history()
    demo_contract_events()
    
    print("\n🎉 演示完成！")
    print("\n💡 提示:")
    print("1. 确保合约已正确部署")
    print("2. 更新示例中的合约地址")
    print("3. 检查账户余额是否足够")
    print("4. 查看Ganache中的交易记录")

if __name__ == "__main__":
    main() 