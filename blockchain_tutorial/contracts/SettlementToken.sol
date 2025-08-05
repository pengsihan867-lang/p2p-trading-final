// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SettlementToken
 * @dev 结算系统代币合约
 * 这是一个简单的ERC-20代币，用于区块链结算系统
 */
contract SettlementToken is ERC20, Ownable {
    
    // 代币精度
    uint8 private constant DECIMALS = 18;
    
    // 初始供应量
    uint256 private constant INITIAL_SUPPLY = 1000000 * 10**18; // 100万代币
    
    // 交易记录结构
    struct Transaction {
        address from;
        address to;
        uint256 amount;
        uint256 timestamp;
        string description;
    }
    
    // 交易记录映射
    mapping(uint256 => Transaction) public transactions;
    uint256 public transactionCount;
    
    // 事件
    event TransactionRecorded(
        uint256 indexed transactionId,
        address indexed from,
        address indexed to,
        uint256 amount,
        string description
    );
    
    event BatchTransferCompleted(
        address[] recipients,
        uint256[] amounts,
        uint256 totalAmount
    );
    
    /**
     * @dev 构造函数，初始化代币
     * @param name 代币名称
     * @param symbol 代币符号
     */
    constructor(
        string memory name,
        string memory symbol
    ) ERC20(name, symbol) Ownable(msg.sender) {
        _mint(msg.sender, INITIAL_SUPPLY);
    }
    
    /**
     * @dev 记录交易
     * @param to 接收方地址
     * @param amount 转账金额
     * @param description 交易描述
     */
    function transferWithRecord(
        address to,
        uint256 amount,
        string memory description
    ) public returns (bool) {
        bool success = transfer(to, amount);
        
        if (success) {
            transactionCount++;
            transactions[transactionCount] = Transaction({
                from: msg.sender,
                to: to,
                amount: amount,
                timestamp: block.timestamp,
                description: description
            });
            
            emit TransactionRecorded(
                transactionCount,
                msg.sender,
                to,
                amount,
                description
            );
        }
        
        return success;
    }
    
    /**
     * @dev 批量转账功能
     * @param recipients 接收方地址数组
     * @param amounts 转账金额数组
     * @param description 交易描述
     */
    function batchTransfer(
        address[] memory recipients,
        uint256[] memory amounts,
        string memory description
    ) public returns (bool) {
        require(
            recipients.length == amounts.length,
            "Recipients and amounts arrays must have the same length"
        );
        
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            totalAmount += amounts[i];
        }
        
        require(
            balanceOf(msg.sender) >= totalAmount,
            "Insufficient balance for batch transfer"
        );
        
        for (uint256 i = 0; i < recipients.length; i++) {
            require(
                transfer(recipients[i], amounts[i]),
                "Transfer failed"
            );
            
            // 记录每笔交易
            transactionCount++;
            transactions[transactionCount] = Transaction({
                from: msg.sender,
                to: recipients[i],
                amount: amounts[i],
                timestamp: block.timestamp,
                description: description
            });
            
            emit TransactionRecorded(
                transactionCount,
                msg.sender,
                recipients[i],
                amounts[i],
                description
            );
        }
        
        emit BatchTransferCompleted(recipients, amounts, totalAmount);
        return true;
    }
    
    /**
     * @dev 获取交易记录
     * @param transactionId 交易ID
     * @return 交易记录
     */
    function getTransaction(uint256 transactionId) 
        public 
        view 
        returns (
            address from,
            address to,
            uint256 amount,
            uint256 timestamp,
            string memory description
        ) 
    {
        require(transactionId > 0 && transactionId <= transactionCount, "Invalid transaction ID");
        
        Transaction memory tx = transactions[transactionId];
        return (tx.from, tx.to, tx.amount, tx.timestamp, tx.description);
    }
    
    /**
     * @dev 获取用户的所有交易记录
     * @param user 用户地址
     * @return 交易ID数组
     */
    function getUserTransactions(address user) 
        public 
        view 
        returns (uint256[] memory) 
    {
        uint256[] memory userTxs = new uint256[](transactionCount);
        uint256 count = 0;
        
        for (uint256 i = 1; i <= transactionCount; i++) {
            if (transactions[i].from == user || transactions[i].to == user) {
                userTxs[count] = i;
                count++;
            }
        }
        
        // 调整数组大小
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = userTxs[i];
        }
        
        return result;
    }
    
    /**
     * @dev 销毁代币（仅所有者）
     * @param amount 销毁数量
     */
    function burn(uint256 amount) public onlyOwner {
        _burn(msg.sender, amount);
    }
    
    /**
     * @dev 铸造代币（仅所有者）
     * @param to 接收方地址
     * @param amount 铸造数量
     */
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
} 