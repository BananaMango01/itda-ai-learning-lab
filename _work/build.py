# 사이트 만들기: 템플릿의 %%PDATA%% 자리에 project-data.js를 넣어 루트 index.html을 만든다.
import pathlib
w=pathlib.Path(__file__).parent
t=(w/'site-template.html').read_text(encoding='utf-8')
d=(w/'project-data.js').read_text(encoding='utf-8')
(w.parent/'index.html').write_text(t.replace('%%PDATA%%',d),encoding='utf-8')
print('index.html 완성')
