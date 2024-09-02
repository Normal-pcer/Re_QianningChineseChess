import re
import time

# 更新版本信息
r = re.compile(r'<span id="version-info">Latest built at: (.*)</span>')
# 替换为当前本地时间
with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()
    content = r.sub(
        f'<span id="version-info">Latest built at: {time.strftime("%Y-%m-%d %H:%M:%S", time.localtime())}</span>', content)
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
