/**
 * 안용복의 답장 — 설명하는 글 AI 피드백 도우미 (구글 앱스 스크립트 + 제미나이 판)
 * 「동래 사람 안용복과 펼치는 우리 반 독도 안내 책」 교사용 · 잇:다 AI 러닝랩
 * 저장소에는 코드 사본만 둡니다. API 키는 절대 여기에 쓰지 말고 스크립트 속성에만 넣으세요.
 *
 * 준비: 프로젝트 설정(톱니바퀴) → 스크립트 속성 → 속성 추가
 *       속성 이름: GEMINI_API_KEY   값: Google AI Studio에서 받은 API 키
 */

// 쓸 모델 이름. Google AI Studio의 모델 목록에서 바꿀 수 있어요.
const MODEL = 'gemini-2.5-flash';

function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('안용복의 답장 — 설명하는 글 AI 피드백 도우미')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function getKey_() {
  const key = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  if (!key) throw new Error('API 키가 없어요. 프로젝트 설정 → 스크립트 속성에 GEMINI_API_KEY를 넣어 주세요.');
  return key;
}

function callGemini_(parts, wantJson) {
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + MODEL + ':generateContent';
  const body = {
    contents: [{ role: 'user', parts: parts }],
    generationConfig: wantJson
      ? { responseMimeType: 'application/json', temperature: 0.3 }
      : { temperature: 0 }
  };
  const res = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    headers: { 'x-goog-api-key': getKey_() },
    payload: JSON.stringify(body),
    muteHttpExceptions: true
  });
  const code = res.getResponseCode();
  const data = JSON.parse(res.getContentText());
  if (code !== 200) {
    throw new Error('AI 오류(' + code + '): ' + ((data.error && data.error.message) || '알 수 없음'));
  }
  const cand = data.candidates && data.candidates[0];
  if (!cand || !cand.content) throw new Error('AI가 답을 주지 않았어요. 잠시 뒤 다시 눌러 주세요.');
  return cand.content.parts.map(function (p) { return p.text || ''; }).join('');
}

// 사진 속 손글씨를 글로 옮기기
function ocr(base64, mimeType, prompt) {
  return callGemini_([{ text: prompt }, { inlineData: { mimeType: mimeType, data: base64 } }], false);
}

// 일반 글 답 받기
function ask(prompt) {
  return callGemini_([{ text: prompt }], false);
}

// 루브릭 피드백(JSON) 받기
function feedback(prompt) {
  const text = callGemini_([{ text: prompt }], true);
  try {
    return JSON.parse(text);
  } catch (e) {
    const m = text.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
    throw new Error('답의 모양이 달라요. 한 번 더 눌러 주세요.');
  }
}
