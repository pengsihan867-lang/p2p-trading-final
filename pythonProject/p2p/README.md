# 微电网 P2P 能源交易与 VPP 优化仿真平台

本项目旨在构建一个微电网 点对点（Peer-to-Peer, P2P）能源交易与虚拟电厂（Virtual Power Plant, VPP）优化调度的仿真平台，并探索区块链在能源结算中的应用。

## 背景与动机
- 分布式能源（屋顶光伏）与家庭储能快速普及，传统集中式调度难以充分激励 prosumer（既用电又发电的用户）。
- P2P 能源交易允许用户之间直接买卖多余电力，提高可再生能源利用率与社区自给率。
- VPP 在社区层面聚合资源，与外部零售商结算，实现内部优化与外部市场的高效对接。

## 核心思路
- 基于 5 分钟离散时间步，建立混合整数线性规划（MILP）模型，使每个时段各 prosumer 的能量守恒：光伏发电、电池放电、外部购电共同满足负荷、电池充电与对外出售。
- 通过 P2P 交易池撮合内部买卖，保证交易净额守恒；VPP 层调度社区电池并与外部电价交互。
- 在能量约束（电池容量、充放电效率、SOC 上下限等）下，最小化系统总成本（或最大化社会福利）。

## 主要目标与功能
1) 数据读取与预处理：从 Excel 导入 5 分钟粒度的光伏、负荷与电价数据，自动识别列名与单位（$/MWh 自动换算为 $/kWh）。
2) 优化建模与求解：使用 Gurobi 构建 MILP，刻画 prosumer、社区电池与 VPP 的能量平衡和约束；支持“固定价 / 批发价传递”与“settlement_only / coupled”两种内部结算模式。
3) 结算与指标：根据优化结果生成结算报表与汇总 CSV；后续扩展社区自给率、自我消纳率、P2P 交易量、电池吞吐量与总成本等 KPI。
4) 可视化与敏感性分析：导出电池 SOC、购售电趋势、内部交易等数据，便于绘图与参数敏感性分析（电池容量、光伏规模、价格上限等）。
5) 区块链结算原型：设计基于“Solar Coin”的链上记账机制，将 P2P 结算结果写入分布式账本，实现交易透明与可追溯（规划中）。

## 代码结构
- `p2p.py`：核心脚本。包含数据解析、参数容器、MILP 建模/求解，以及结果导出。
- 输出文件：`p2p_vpp_summary.csv`、`settlements.csv`、`battery_P{i}.csv` 等。

## 运行环境
- Python 3.9+
- 依赖：`numpy`、`pandas`、`openpyxl`、`matplotlib`、`gurobipy`
- 许可：需已正确安装 Gurobi 学术/商业 license（`grbgetkey`）。

示例安装：
```bash
pip install numpy pandas openpyxl matplotlib gurobipy
```

## 数据格式（Excel）
- 时间列：支持 `Date`+`Time` 或 `timestamp`（将自动标准化为同一日期的 5 分钟时间戳）。
- 电价列：自动识别多种命名（如 `Price($/kWh)`、`RRP($/MWh)` 等），若识别到 $/MWh 将自动除以 1000。
- 光伏：`P1..PN`（或宽松匹配 `pv1`/`prosumer1` 等）。
- 负荷（可选）：`Load1..LoadN`；缺失时默认 0。

## 快速调用
```python
from p2p import p2p_market_opt_demo

res = p2p_market_opt_demo(
    file_path="your.xlsx",
    sheet_name="adjusted data",
    retail_pricing_mode="wholesale_pass",   # 或 "fixed"
    prosumer_price_mode="settlement_only",  # 或 "coupled"
    # VPP（与项目表格一致的默认值已内置）
    vpp_batt_ecap=50.0,
    vpp_pch_max=10.0,
    vpp_pdis_max=10.0,
)
```

## 关键参数（与项目表一致）
- 零售商：`markup=0.08 $/kWh`、`beta_fit=0.8`、`buy_floor=0.10`、`sell_cap=0.12`；定价模式 `fixed / wholesale_pass`。
- Prosumer 电池（每 5 分钟步长）：效率 `η_ch=η_dis=0.95`，`SOC∈[10%, 90%]`，初始 `SOC0=50%`，线损约 `3%`（`line_eta=0.97`）。
- 每户电池容量/功率上限（默认 N≥4 时生效）：`Ecap=[10,6,0,5] kWh`，`Pch_max=Pdis_max=[5,3,0,3] kW`。
- VPP 电池默认启用：`Ecap=50 kWh`，`Pch_max=Pdis_max=10 kW`，`SOC0=50%`。

> 注：表格中的“Daily fixed 0.9 $/day”当前未计入目标函数，可作为后续扩展项（见 Roadmap）。

## 输出
- `p2p_vpp_summary.csv`：时间序列汇总（外部购/售、VPP 充放电、内部交易量、内部结算价）。
- `settlements.csv`：P2P 成交明细（时刻/卖方/买方/能量/价格）。
- `battery_P{i}.csv`：每户电池的 `SOC/Pch/Pdis` 序列。

## Web 前端（SolarCoin 交易演示）
- 路径：`web/` 下为一个纯静态 dApp（`index.html`、`styles.css`、`app.js`）。
- 功能：在浏览器内用简化规则模拟 4 个 prosumer 的 24 小时 P2P 能源交易，并以 SolarCoin (SLR) 计价；支持输入 Prosumer 1 的日总用电需求（kWh），展示：
  - 能量曲线：内部撮合、外部购电、外部售电（kWh/步）。
  - 金额曲线：内部结算金额、外部净额（SLR/步）。
  - VPP 外部交易环图（进口/出口）。
  - 各 prosumer 日末 SolarCoin 钱包余额柱状图。
  - Prosumer 1 的英文摘要与导出 CSV（本页模拟结果）。
- 运行：直接打开 `web/index.html` 即可；或将 `web/` 配置为 GitHub Pages 根目录对外访问。
- 发布到 GitHub Pages：在仓库 Settings → Pages 中，将 Source 选为 `main` 分支的 `/web` 目录，保存后稍等即可通过 Pages URL 访问。

## 一键清理
- 运行 `python cleanup.py` 会：
  - 删除根目录历史产物（`battery_P*.csv`、`*_summary.csv`、`*_quickplot.png`、`p2p_vpp_*.*`、`settlements.csv` 等）。
  - 重置 `outputs/` 目录（清空并重新创建）。


## Roadmap（后续工作）
- KPI 计算模块：社区自给率、自我消纳率、P2P 占比、总成本分解等。
- 电价机制扩展：日固定费用、分时电价/尖峰电价、惩罚与补贴机制。
- 区块链原型：将 `settlements.csv` 映射为链上交易，支持哈希校验与事件查询。
- 更友好的 CLI/可视化：一键运行、情景参数化与图表导出。

## 引用与致谢
- 优化求解器：Gurobi Optimizer。
- 数据处理与绘图：NumPy、Pandas、Matplotlib。
