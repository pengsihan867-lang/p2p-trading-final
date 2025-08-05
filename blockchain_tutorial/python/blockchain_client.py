#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
区块链客户端
用于与智能合约交互的Python脚本
"""

import json
import time
from typing import List, Dict, Any
from web3 import Web3
from eth_account import Account
import os

class BlockchainClient:
    """区块链客户端类"""
    
    def __init__(self, ganache_url: str = "http://127.0.0.1:7545"):
        """
        初始化区块链客户端
        
        Args:
            ganache_url: Ganache本地链的URL
        """
        self.w3 = Web3(Web3.HTTPProvider(ganache_url))
        self.account = None
        self.contract = None
        self.contract_address = None
        
        # 检查连接
        if not self.w3.is_connected():
            raise Exception("无法连接到Ganache，请确保Ganache正在运行")
        
        print(f"✅ 成功连接到Ganache: {ganache_url}")
        print(f"当前区块高度: {self.w3.eth.block_number}")
    
    def load_account(self, private_key: str = None):
        """
        加载账户
        
        Args:
            private_key: 私钥，如果为None则使用默认账户
        """
        if private_key:
            self.account = Account.from_key(private_key)
        else:
            # 使用Ganache的默认账户
            accounts = self.w3.eth.accounts
            if accounts:
                self.account = Account.from_key("0x" + "0" * 64)  # 默认账户
                print(f"使用默认账户: {accounts[0]}")
            else:
                raise Exception("没有可用的账户")
        
        print(f"账户地址: {self.account.address}")
        balance = self.w3.eth.get_balance(self.account.address)
        print(f"账户余额: {self.w3.from_wei(balance, 'ether')} ETH")
    
    def load_contract(self, contract_address: str, abi_path: str):
        """
        加载智能合约
        
        Args:
            contract_address: 合约地址
            abi_path: ABI文件路径
        """
        try:
            with open(abi_path, 'r') as f:
                abi = json.load(f)
            
            self.contract = self.w3.eth.contract(
                address=contract_address,
                abi=abi
            )
            self.contract_address = contract_address
            
            print(f"✅ 成功加载合约: {contract_address}")
            
        except FileNotFoundError:
            print(f"❌ 找不到ABI文件: {abi_path}")
            raise
        except Exception as e:
            print(f"❌ 加载合约失败: {e}")
            raise
    
    def get_token_balance(self, address: str = None) -> int:
        """
        获取代币余额
        
        Args:
            address: 地址，如果为None则使用当前账户
            
        Returns:
            代币余额
        """
        if not address:
            address = self.account.address
        
        if not self.contract:
            raise Exception("合约未加载")
        
        balance = self.contract.functions.balanceOf(address).call()
        return balance
    
    def transfer_tokens(self, to_address: str, amount: int, description: str = "") -> str:
        """
        转账代币
        
        Args:
            to_address: 接收方地址
            amount: 转账金额
            description: 交易描述
            
        Returns:
            交易哈希
        """
        if not self.contract:
            raise Exception("合约未加载")
        
        # 构建交易
        transaction = self.contract.functions.transferWithRecord(
            to_address,
            amount,
            description
        ).build_transaction({
            'from': self.account.address,
            'gas': 200000,
            'gasPrice': self.w3.eth.gas_price,
            'nonce': self.w3.eth.get_transaction_count(self.account.address)
        })
        
        # 签名交易
        signed_txn = self.w3.eth.account.sign_transaction(transaction, self.account.key)
        
        # 发送交易
        tx_hash = self.w3.eth.send_raw_transaction(signed_txn.rawTransaction)
        
        print(f"✅ 交易已发送: {tx_hash.hex()}")
        return tx_hash.hex()
    
    def batch_transfer(self, recipients: List[str], amounts: List[int], description: str = "") -> str:
        """
        批量转账
        
        Args:
            recipients: 接收方地址列表
            amounts: 转账金额列表
            description: 交易描述
            
        Returns:
            交易哈希
        """
        if not self.contract:
            raise Exception("合约未加载")
        
        if len(recipients) != len(amounts):
            raise ValueError("接收方和金额列表长度必须相同")
        
        # 构建交易
        transaction = self.contract.functions.batchTransfer(
            recipients,
            amounts,
            description
        ).build_transaction({
            'from': self.account.address,
            'gas': 500000,  # 批量转账需要更多gas
            'gasPrice': self.w3.eth.gas_price,
            'nonce': self.w3.eth.get_transaction_count(self.account.address)
        })
        
        # 签名交易
        signed_txn = self.w3.eth.account.sign_transaction(transaction, self.account.key)
        
        # 发送交易
        tx_hash = self.w3.eth.send_raw_transaction(signed_txn.rawTransaction)
        
        print(f"✅ 批量转账已发送: {tx_hash.hex()}")
        return tx_hash.hex()
    
    def get_transaction_record(self, transaction_id: int) -> Dict[str, Any]:
        """
        获取交易记录
        
        Args:
            transaction_id: 交易ID
            
        Returns:
            交易记录
        """
        if not self.contract:
            raise Exception("合约未加载")
        
        try:
            tx_data = self.contract.functions.getTransaction(transaction_id).call()
            
            return {
                'transaction_id': transaction_id,
                'from': tx_data[0],
                'to': tx_data[1],
                'amount': tx_data[2],
                'timestamp': tx_data[3],
                'description': tx_data[4]
            }
        except Exception as e:
            print(f"❌ 获取交易记录失败: {e}")
            return None
    
    def get_user_transactions(self, user_address: str = None) -> List[int]:
        """
        获取用户的所有交易记录
        
        Args:
            user_address: 用户地址，如果为None则使用当前账户
            
        Returns:
            交易ID列表
        """
        if not user_address:
            user_address = self.account.address
        
        if not self.contract:
            raise Exception("合约未加载")
        
        try:
            transaction_ids = self.contract.functions.getUserTransactions(user_address).call()
            return transaction_ids
        except Exception as e:
            print(f"❌ 获取用户交易记录失败: {e}")
            return []
    
    def wait_for_transaction(self, tx_hash: str, timeout: int = 60) -> Dict[str, Any]:
        """
        等待交易确认
        
        Args:
            tx_hash: 交易哈希
            timeout: 超时时间（秒）
            
        Returns:
            交易收据
        """
        print(f"⏳ 等待交易确认: {tx_hash}")
        
        start_time = time.time()
        while time.time() - start_time < timeout:
            try:
                receipt = self.w3.eth.get_transaction_receipt(tx_hash)
                if receipt and receipt['status'] == 1:
                    print(f"✅ 交易已确认，区块号: {receipt['blockNumber']}")
                    return receipt
                elif receipt and receipt['status'] == 0:
                    print(f"❌ 交易失败")
                    return receipt
            except:
                pass
            
            time.sleep(1)
        
        raise Exception("交易确认超时")
    
    def get_contract_info(self) -> Dict[str, Any]:
        """
        获取合约信息
        
        Returns:
            合约信息
        """
        if not self.contract:
            raise Exception("合约未加载")
        
        try:
            name = self.contract.functions.name().call()
            symbol = self.contract.functions.symbol().call()
            total_supply = self.contract.functions.totalSupply().call()
            transaction_count = self.contract.functions.transactionCount().call()
            
            return {
                'name': name,
                'symbol': symbol,
                'total_supply': total_supply,
                'transaction_count': transaction_count,
                'address': self.contract_address
            }
        except Exception as e:
            print(f"❌ 获取合约信息失败: {e}")
            return None

def main():
    """主函数 - 演示区块链客户端的使用"""
    
    # 创建客户端
    client = BlockchainClient()
    
    # 加载账户（使用Ganache的默认账户）
    client.load_account()
    
    # 这里需要先部署合约并获取地址和ABI
    # 示例地址（实际使用时需要替换为真实地址）
    contract_address = "0x1234567890123456789012345678901234567890"
    abi_path = "contracts/SettlementToken.json"
    
    try:
        # 加载合约
        client.load_contract(contract_address, abi_path)
        
        # 获取合约信息
        info = client.get_contract_info()
        if info:
            print(f"合约名称: {info['name']}")
            print(f"合约符号: {info['symbol']}")
            print(f"总供应量: {info['total_supply']}")
            print(f"交易数量: {info['transaction_count']}")
        
        # 获取当前账户的代币余额
        balance = client.get_token_balance()
        print(f"当前代币余额: {balance}")
        
    except Exception as e:
        print(f"❌ 错误: {e}")
        print("请确保合约已部署并且地址和ABI文件正确")

if __name__ == "__main__":
    main() 