import pandas as pd
import requests
from datetime import datetime, timedelta
import os
import time
import random


def get_qld_data():
    """获取昆士兰州电力数据并输出为Excel"""

    # 获取当前脚本所在的目录
    script_dir = os.path.dirname(os.path.abspath(__file__))

    # 获取当前月份
    current_date = datetime.now()
    year = current_date.year
    month = current_date.month

    # 格式化月份为两位数
    month_str = f"{month:02d}"

    # 构建URL
    base_url = "https://aemo.com.au/aemo/data/nem/priceanddemand"
    filename = f"PRICE_AND_DEMAND_{year}{month_str}_QLD1.csv"
    url = f"{base_url}/{filename}"

    print(f"正在获取数据: {url}")

    # 设置请求头，模拟浏览器访问
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Referer': 'https://aemo.com.au/'
    }

    try:
        # 添加随机延迟，避免被识别为机器人
        time.sleep(random.uniform(1, 3))

        # 下载数据
        session = requests.Session()
        session.headers.update(headers)

        # 首先访问主页，建立会话
        print("正在建立连接...")
        session.get('https://aemo.com.au/', timeout=10)

        # 然后下载数据
        print("正在下载数据...")
        response = session.get(url, timeout=30)
        response.raise_for_status()

        # 保存CSV文件到脚本所在目录
        csv_filename = os.path.join(script_dir, f"qld_data_{year}_{month_str}.csv")
        with open(csv_filename, 'wb') as f:
            f.write(response.content)

        print(f"CSV文件已保存: {csv_filename}")

        # 读取CSV数据
        df = pd.read_csv(csv_filename)

        # 转换时间列
        df['SETTLEMENTDATE'] = pd.to_datetime(df['SETTLEMENTDATE'])

        # 添加更多有用的列
        df['DATE'] = df['SETTLEMENTDATE'].dt.date
        df['TIME'] = df['SETTLEMENTDATE'].dt.time
        df['HOUR'] = df['SETTLEMENTDATE'].dt.hour
        df['DAY_OF_WEEK'] = df['SETTLEMENTDATE'].dt.day_name()

        # 计算价格变化
        df['PRICE_CHANGE'] = df['RRP'].diff()
        df['PRICE_CHANGE_PCT'] = (df['RRP'].pct_change() * 100).round(2)

        # 添加价格区间分类
        def categorize_price(price):
            if price < 50:
                return '低价格 (<50)'
            elif price < 100:
                return '中等价格 (50-100)'
            elif price < 200:
                return '高价格 (100-200)'
            else:
                return '极高价格 (>200)'

        df['PRICE_CATEGORY'] = df['RRP'].apply(categorize_price)

        # 重新排列列顺序
        columns_order = [
            'SETTLEMENTDATE', 'DATE', 'TIME', 'HOUR', 'DAY_OF_WEEK',
            'REGION', 'TOTALDEMAND', 'RRP', 'PRICE_CATEGORY',
            'PRICE_CHANGE', 'PRICE_CHANGE_PCT', 'PERIODTYPE'
        ]

        df = df[columns_order]

        # 创建Excel文件，保存在脚本所在目录
        excel_filename = os.path.join(script_dir, f"昆士兰州电力数据_{year}年{month}月.xlsx")

        with pd.ExcelWriter(excel_filename, engine='openpyxl') as writer:
            # 主数据表
            df.to_excel(writer, sheet_name='原始数据', index=False)

            # 统计摘要表
            summary_data = {
                '统计项目': [
                    '数据点总数',
                    '时间范围',
                    '平均价格 (澳元/MWh)',
                    '最高价格 (澳元/MWh)',
                    '最低价格 (澳元/MWh)',
                    '价格标准差',
                    '平均需求 (MW)',
                    '最高需求 (MW)',
                    '最低需求 (MW)'
                ],
                '数值': [
                    len(df),
                    f"{df['SETTLEMENTDATE'].min()} 到 {df['SETTLEMENTDATE'].max()}",
                    round(df['RRP'].mean(), 2),
                    round(df['RRP'].max(), 2),
                    round(df['RRP'].min(), 2),
                    round(df['RRP'].std(), 2),
                    round(df['TOTALDEMAND'].mean(), 2),
                    round(df['TOTALDEMAND'].max(), 2),
                    round(df['TOTALDEMAND'].min(), 2)
                ]
            }

            summary_df = pd.DataFrame(summary_data)
            summary_df.to_excel(writer, sheet_name='统计摘要', index=False)

            # 按小时统计表
            hourly_stats = df.groupby('HOUR').agg({
                'RRP': ['mean', 'max', 'min', 'std'],
                'TOTALDEMAND': ['mean', 'max', 'min']
            }).round(2)

            hourly_stats.columns = ['平均价格', '最高价格', '最低价格', '价格标准差',
                                    '平均需求', '最高需求', '最低需求']
            hourly_stats.to_excel(writer, sheet_name='按小时统计')

            # 价格分类统计表
            price_category_stats = df['PRICE_CATEGORY'].value_counts().reset_index()
            price_category_stats.columns = ['价格分类', '数据点数量']
            price_category_stats.to_excel(writer, sheet_name='价格分类统计', index=False)

        print(f"Excel文件已保存: {excel_filename}")

        # 打印数据摘要
        print(f"\n数据摘要:")
        print(f"数据点数量: {len(df)}")
        print(f"时间范围: {df['SETTLEMENTDATE'].min()} 到 {df['SETTLEMENTDATE'].max()}")
        print(f"平均价格: {df['RRP'].mean():.2f} 澳元/MWh")
        print(f"最高价格: {df['RRP'].max():.2f} 澳元/MWh")
        print(f"最低价格: {df['RRP'].min():.2f} 澳元/MWh")
        print(f"平均需求: {df['TOTALDEMAND'].mean():.2f} MW")

        return excel_filename

    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 403:
            print(f"❌ 访问被拒绝 (403 Forbidden)")
            print("可能的原因:")
            print("1. 网站需要认证或登录")
            print("2. 网站检测到自动化访问")
            print("3. 需要特定的请求头或Cookie")
            print("\n建议解决方案:")
            print(
                "1. 手动访问 https://aemo.com.au/energy-systems/electricity/national-electricity-market-nem/data-nem/aggregated-data")
            print("2. 下载CSV文件到脚本所在目录")
            print("3. 使用 create_excel_from_csv.py 脚本处理本地文件")
        else:
            print(f"HTTP错误: {e}")
        return None
    except requests.exceptions.RequestException as e:
        print(f"网络请求错误: {e}")
        return None
    except Exception as e:
        print(f"处理数据时出错: {e}")
        return None


def download_manual_guide():
    """提供手动下载指南"""
    print("\n📋 手动下载指南:")
    print(
        "1. 打开浏览器访问: https://aemo.com.au/energy-systems/electricity/national-electricity-market-nem/data-nem/aggregated-data")
    print("2. 找到 'Aggregated price and demand' 部分")
    print("3. 下载昆士兰州(QLD1)的CSV文件")
    print("4. 将文件重命名为 'price_demand_data.csv'")
    print("5. 将文件放在脚本所在目录")
    print("6. 运行 create_excel_from_csv.py 脚本")


if __name__ == "__main__":
    print("🚀 开始获取AEMO昆士兰州电力数据...")
    excel_file = get_qld_data()
    if excel_file:
        print(f"\n✅ 成功创建Excel文件: {excel_file}")
    else:
        print("\n❌ 获取数据失败")
        download_manual_guide()
