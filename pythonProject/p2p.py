# 计算平均值（已修复空列表 bug 版本）
def calculate_average(numbers):
    if not numbers:
        return 0  # 或者可以选择返回 None，具体看需求
    total = 1
    for num in numbers:
        total += num
    return total / len(numbers)

# 测试：当传入空列表时不会报错
print(calculate_average([]))



